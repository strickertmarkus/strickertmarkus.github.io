"""Build the explorer figure (budget/assets/pulse-figure) from scripts/figure-source.

Uses the sculpted model as it is (its own triangles and painted texture), fitted onto
the animation skeleton and skinned, in the explorer's body.json/body.bin format."""
import sys,os,io,json,struct,numpy as np
def load(path):
    b=open(path,'rb').read();assert b[:4]==b'glTF'
    off=12;js=None;bin_=None
    while off<len(b):
        ln,typ=struct.unpack('<II',b[off:off+8]);chunk=b[off+8:off+8+ln];off+=8+ln
        if typ==0x4E4F534A: js=json.loads(chunk)
        elif typ==0x004E4942: bin_=chunk
    return js,bin_
CT={5120:np.int8,5121:np.uint8,5122:np.int16,5123:np.uint16,5125:np.uint32,5126:np.float32}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def acc(js,bin_,i):
    a=js['accessors'][i];bv=js['bufferViews'][a['bufferView']];dt=np.dtype(CT[a['componentType']]);n=NC[a['type']]
    stride=bv.get('byteStride',0);o=bv.get('byteOffset',0)+a.get('byteOffset',0)
    if stride and stride!=dt.itemsize*n:
        raw=np.frombuffer(bin_,np.uint8,count=stride*a['count'],offset=o).reshape(a['count'],stride)[:,:dt.itemsize*n]
        arr=raw.copy().view(dt).reshape(a['count'],n)
    else: arr=np.frombuffer(bin_,dt,count=a['count']*n,offset=o).reshape(a['count'],n)
    if a.get('normalized'): arr=arr.astype(np.float32)/np.iinfo(dt).max
    return arr

from PIL import Image
from scipy.spatial import cKDTree
from scipy.sparse.csgraph import connected_components
import scipy.sparse as sp
ROOT=os.path.dirname(os.path.abspath(__file__));SRCDIR=os.path.join(ROOT,'figure-source')
OUT=os.path.join(ROOT,'..','budget','assets','pulse-figure','');os.makedirs(OUT,exist_ok=True)
js,bn=load(os.path.join(SRCDIR,'model.glb'));p=js['meshes'][0]['primitives'][0]
P=acc(js,bn,p['attributes']['POSITION']).astype(float);F=acc(js,bn,p['indices']).reshape(-1,3).astype(np.int64);UV=acc(js,bn,p['attributes']['TEXCOORD_0']).astype(float)
s=1.84/np.ptp(P[:,1]);Q=(P-[0,P[:,1].min(),0])*s;Q[:,0]-=(Q[:,0].max()+Q[:,0].min())/2
# keep the body, drop the loose flaps (geometric components; UV seams split vertices)
_,inv=np.unique(np.round(Q,5),axis=0,return_inverse=True);inv=inv.ravel()
E=inv[np.r_[F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]]];m=inv.max()+1
_,lab=connected_components(sp.coo_matrix((np.ones(len(E)),(E[:,0],E[:,1])),shape=(m,m)),directed=False)
main=np.argmax(np.bincount(lab[inv]));F=F[lab[inv[F[:,0]]]==main]
# midpoint subdivision (twice) so elbows and knees bend smoothly; the shape is unchanged
def subdivide(V,T,F):
    e=np.sort(np.r_[F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]],1);ue,ei=np.unique(e,axis=0,return_inverse=True);ei=ei.reshape(3,-1).T
    mid=len(V)+np.arange(len(ue));V=np.r_[V,(V[ue[:,0]]+V[ue[:,1]])/2];T=np.r_[T,(T[ue[:,0]]+T[ue[:,1]])/2]
    a,b,c=F.T;ab,bc,ca=mid[ei[:,0]],mid[ei[:,1]],mid[ei[:,2]]
    return V,T,np.r_[np.c_[a,ab,ca],np.c_[ab,b,bc],np.c_[ca,bc,c],np.c_[ab,bc,ca]]
V,T=Q,UV
for _ in range(2): V,T,F=subdivide(V,T,F)
used=np.unique(F);remap=-np.ones(len(V),int);remap[used]=np.arange(len(used));V=V[used];T=T[used];F=remap[F]
# --- fit limbs onto the skeleton (same warp as the rebuilt version) ---
def ss(a,b,x):
    t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
def rot_between(a,b):
    a=a/np.linalg.norm(a); b=b/np.linalg.norm(b); v=np.cross(a,b); c=a@b
    K=np.array([[0,-v[2],v[1]],[v[2],0,-v[0]],[-v[1],v[0],0]]); return np.eye(3)+K+K@K/(1+c)
def seg_xform(R0,M0,r0,m0):
    d0=M0-R0; d1=m0-r0; Rm=rot_between(d0,d1); k=np.linalg.norm(d1)/np.linalg.norm(d0); u=d0/np.linalg.norm(d0)
    def f(X):
        q=X-R0; q=q+((q@u)[:,None]*u)*(k-1); return q@Rm.T+r0
    return f
def chain(X,R0,M0,E0,r0,m0,e0,blend=.03):
    f1=seg_xform(R0,M0,r0,m0); f2=seg_xform(M0,E0,m0,e0); u=(M0-R0)/np.linalg.norm(M0-R0); w=ss(-blend,blend,(X-M0)@u)
    return (1-w)[:,None]*f1(X)+w[:,None]*f2(X)
out=V.copy()
for sg in (-1,1):
    Xs=lambda q: np.array([sg*q[0],q[1],q[2]]); side=(V[:,0]*sg>0)
    ys=np.array([1.24,1.22,1.18,1.10,1.06,1.02,.98,.94,.90,.86,.82,.78,.74,.70]); bs=np.array([.19,.187,.19,.175,.2,.22,.237,.255,.25,.25,.25,.26,.27,.27])
    b=np.interp(V[:,1],ys[::-1],bs[::-1]); b=np.where(V[:,1]>1.24,.19,b)
    warm=side*ss(b-.008,b+.008,np.abs(V[:,0]))*(1-ss(1.36,1.47,V[:,1]))
    arm=chain(V,Xs([.205,1.43,-.03]),Xs([.29,1.14,-.06]),Xs([.352,.93,-.01]),Xs([.225,1.43,0]),Xs([.38,1.14,0]),Xs([.43,.875,.015]))
    wleg=side*(1-warm)*(1-ss(.74,.90,V[:,1]))
    leg=chain(V,Xs([.10,.93,-.025]),Xs([.14,.50,-.03]),Xs([.172,.11,-.055]),Xs([.12,.94,0]),Xs([.13,.51,.015]),Xs([.13,.10,.01]))
    out=out+warm[:,None]*(arm-V)+wleg[:,None]*(leg-out)*(1-warm)[:,None]
V=out
# Soften the AI model's exaggerated relief (thighs especially): blend towards a
# smoothed copy of itself. Weld by position so UV seams move together.
_,wi=np.unique(np.round(V,6),axis=0,return_inverse=True);wi=wi.ravel();nW=wi.max()+1
Fw=wi[F];Ew=np.unique(np.sort(np.r_[Fw[:,[0,1]],Fw[:,[1,2]],Fw[:,[2,0]]],1),axis=0)
Aw=sp.coo_matrix((np.ones(len(Ew)*2),(np.r_[Ew[:,0],Ew[:,1]],np.r_[Ew[:,1],Ew[:,0]])),shape=(nW,nW)).tocsr()
Lw=sp.diags(1/np.maximum(np.asarray(Aw.sum(1)).ravel(),1))@Aw
Vw=np.zeros((nW,3));np.add.at(Vw,wi,V);Vw/=np.bincount(wi,minlength=nW)[:,None]
Bw=Vw.copy()
for lam in [.5,-.53]*int(os.environ.get('RELIEF_IT','25')): Bw=Bw+lam*(Lw@Bw-Bw)
legs=ss(.95,.80,Vw[:,1])*(np.abs(Vw[:,0])<.26)
k=float(os.environ.get('RELIEF','.30'))+float(os.environ.get('RELIEF_LEGS','.25'))*legs
# keep the face as modelled
headz=ss(1.56,1.62,Vw[:,1]);k=k*(1-headz)
Vw=Vw+(Bw-Vw)*k[:,None]
Vh=Vw.copy()
for lam in [.5,-.53]*2: Vw=Vw+lam*(Lw@Vw-Vw)
Vw=Vw+(Vh-Vw)*headz[:,None]
# Face: carve soft eye sockets under a slight brow, so the mannequin face reads from a distance.
eyes=np.zeros(len(Vw))
for sx in (-1,1):
    dx=(Vw[:,0]-sx*.037)/.021; dy=(Vw[:,1]-1.718)/.014
    front=ss(.115,.135,Vw[:,2])
    g=np.exp(-(dx*dx+dy*dy))*front; eyes=np.maximum(eyes,g)
    brow=np.exp(-(((Vw[:,0]-sx*.037)/.026)**2+((Vw[:,1]-1.742)/.008)**2))*front
    Vw[:,2]+=.007*brow
Vw[:,2]-=.026*eyes
V=Vw[wi]; EYES=eyes[wi]
# --- hands and feet: the site draws its own gripping hands and shoes ---
cent=V[F].mean(1);drop=np.zeros(len(F),bool)
for sg in (-1,1):
    el=np.array([sg*.38,1.14,0]);wr=np.array([sg*.43,.875,.015]);u=(wr-el)/np.linalg.norm(wr-el)
    q=cent-wr;al=q@u;rad=np.linalg.norm(q-al[:,None]*u,axis=1);drop|=(al>.035)&(rad<.14)
drop|=(cent[:,1]<.068)&(np.abs(cent[:,0])<.3)
F=F[~drop];used=np.unique(F);remap=-np.ones(len(V),int);remap[used]=np.arange(len(used));V=V[used];T=T[used];F=remap[F];EYES=EYES[used]
# --- skin weights from the current mannequin (same rest pose) ---
# Skin weights come from the original procedural mannequin, which shares the rest skeleton.
mm=json.load(open(os.path.join(SRCDIR,'weights-reference.json')));bb=open(os.path.join(SRCDIR,'weights-reference.bin'),'rb').read()
def get(nm,dt):
    a=mm['attributes'][nm];return np.frombuffer(bb,dtype=dt,count=a['length'],offset=a['offset']).reshape(-1,a['itemSize'])
P0=get('position','<f4');SI0=get('skinIndex','<u2');SW0=get('skinWeight','<f4')
W0=np.zeros((len(P0),11));np.add.at(W0,(np.repeat(np.arange(len(P0)),4),SI0.ravel()),SW0.ravel())
dist,idx=cKDTree(P0).query(V,k=6);w=1/np.maximum(dist,1e-4)**2;w/=w.sum(1,keepdims=True);W=(W0[idx]*w[...,None]).sum(1)
top=np.argsort(-W,1)[:,:4];tw=np.take_along_axis(W,top,1);tw/=tw.sum(1,keepdims=True)
# texture: the model's own painting
img=js['images'][0];bv=js['bufferViews'][img['bufferView']]
Image.open(io.BytesIO(bn[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']])).convert('RGB').save(OUT+'texture.webp',quality=92)
C=np.ones((len(V),3))*(1-.30*EYES)[:,None]
blobs=[('position',V.astype('<f4'),3),('color',C.astype('<f4'),3),('uv',T.astype('<f4'),2),('skinIndex',top.astype('<u2'),4),('skinWeight',tw.astype('<f4'),4),('index',F.astype('<u4').ravel(),1)]
meta={'rest':mm['rest'],'texture':'texture.webp','attributes':{},'vertices':int(len(V)),'triangles':int(len(F))};off=0;data=b''
for nm,arr,isz in blobs:
    raw=np.ascontiguousarray(arr).tobytes();meta['attributes'][nm]={'offset':off,'length':int(arr.size),'itemSize':isz};data+=raw;off+=len(raw)
open(OUT+'body.bin','wb').write(data);json.dump(meta,open(OUT+'body.json','w'),separators=(',',':'))
print('verts',len(V),'tris',len(F),'MB',round(len(data)/1e6,2),'tex KB',os.path.getsize(OUT+'texture.webp')//1024)
