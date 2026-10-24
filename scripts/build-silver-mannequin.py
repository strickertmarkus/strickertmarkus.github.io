"""Original procedural mannequin. Rebuild with numpy + scikit-image; no external model license."""
from pathlib import Path
import numpy as np,json
from skimage.measure import marching_cubes
out=Path(__file__).resolve().parents[1]/'budget/assets/silver-mannequin-v1'
out.mkdir(parents=True,exist_ok=True)
step=.012
origin=np.array([-.68,-.02,-.25])
axes=[np.arange(origin[0],.69,step),np.arange(origin[1],1.94,step),np.arange(origin[2],.32,step)]
x,y,z=np.meshgrid(*axes,indexing='ij'); field=np.full(x.shape,10.,dtype=np.float32)
def union(d,k=.025):
 global field
 h=np.maximum(k-np.abs(field-d),0)/k
 field=np.minimum(field,d)-h*h*k*.25

def ell(c,r,k=.025):
 q=[(p-v)/a for p,v,a in zip((x,y,z),c,r)]
 d=(np.sqrt(sum(v*v for v in q))-1)*min(r)
 union(d,k)
def limb(a,b,r1,r2,bulge=.0):
 a=np.array(a);b=np.array(b);d=b-a;ll=sum(d*d)
 t=np.clip(((x-a[0])*d[0]+(y-a[1])*d[1]+(z-a[2])*d[2])/ll,0,1)
 dist=np.sqrt((x-a[0]-t*d[0])**2+(y-a[1]-t*d[1])**2+(z-a[2]-t*d[2])**2)
 radius=r1*(1-t)+r2*t+bulge*np.sin(np.pi*t)
 union(dist-radius,.024)
# Torso: tapered waist, rib cage, upper back, subtle pectoral/abdominal relief.
ell([0,1.18,0],[.175,.30,.105],.04)
ell([0,1.37,-.005],[.235,.18,.125],.045)
ell([0,.965,-.005],[.185,.15,.135],.035)
for s in [-1,1]:
 ell([s*.105,1.365,.093],[.12,.082,.055],.015)
 ell([s*.105,1.315,-.075],[.13,.17,.065],.03)
 for yy in [1.24,1.16,1.08]:ell([s*.045,yy,.091],[.05,.045,.025],.018)
# Neck, head with softened jaw/chin and understated nose/ears.
ell([0,1.535,0],[.066,.12,.068],.025)
ell([0,1.705,.006],[.102,.139,.102],.022)
ell([0,1.653,.037],[.083,.086,.081],.018)
ell([0,1.635,.063],[.061,.044,.06],.014)
ell([0,1.706,.103],[.020,.028,.022],.008)
for s in [-1,1]:
 ell([s*.1,1.698,.001],[.018,.039,.026],.008)
 sh=[s*.225,1.43,0];el=[s*.38,1.14,0];wr=[s*.43,.875,.015]
 ell(sh,[.092,.106,.093],.03)
 limb(sh,el,.078,.050,.012)
 limb(el,wr,.052,.032,.013)
 hip=[s*.12,.94,0];knee=[s*.13,.51,.015];ankle=[s*.13,.10,.01]
 limb(hip,knee,.099,.057,.018)
 limb(knee,ankle,.057,.033,.022)
 ell([s*.13,.52,.052],[.055,.058,.034],.014)
verts,faces,normals,_=marching_cubes(field,level=0,spacing=(step,step,step),gradient_direction='ascent')
verts+=origin
# Normals calculated later by Three.js from winding. Ensure outward facing triangles.
a,b,c=verts[faces[:,0]],verts[faces[:,1]],verts[faces[:,2]]
if np.mean(np.sum(np.cross(b-a,c-a)*normals[faces].mean(axis=1),axis=1))>0:faces=faces[:,::-1]
# Four influence linear skinning; independent segment bones blend across elbows/knees.
rest=[[[0,.96,0],[0,1.48,0]],[[0,1.48,0],[0,1.78,0]]]
for s in [-1,1]:rest.extend([[[s*.225,1.43,0],[s*.38,1.14,0]],[[s*.38,1.14,0],[s*.43,.875,.015]]])
for s in [-1,1]:rest.extend([[[s*.12,.94,0],[s*.13,.51,.015]],[[s*.13,.51,.015],[s*.13,.10,.01]]])
rest.append([[0,.86,0],[0,1.02,0]])
ids=np.zeros((len(verts),4),np.uint16);weights=np.zeros((len(verts),4),np.float32)
def smooth(a,b,v):
 t=np.clip((v-a)/(b-a),0,1);return t*t*(3-2*t)
colors=np.ones((len(verts),3),np.float32)
for i,(vx,vy,vz) in enumerate(verts):
 arm=2 if vx<0 else 4;leg=6 if vx<0 else 8
 if vy>1.51 and abs(vx)<.14: ia,ib,w=1,0,1-smooth(1.49,1.57,vy)
 elif vy>.80 and abs(vx)>.20:
  ia,ib,w=arm,arm+1,1-smooth(1.08,1.20,vy)
  # Shoulder blend into upper torso.
  if vy>1.38 and abs(vx)<.28:ia,ib,w=0,arm,smooth(.18,.285,abs(vx))
 elif vy<.92:
  ia,ib,w=leg,leg+1,1-smooth(.45,.57,vy)
  if vy>.84:ia,ib,w=10,leg,1-smooth(.84,.96,vy)
 elif vy<1.03:ia,ib,w=10,0,smooth(.92,1.04,vy)
 else:ia,ib,w=0,0,0
 ids[i,:2]=[ia,ib];weights[i,:2]=[1-w,w]
 # Dark fitted training shorts, blended smoothly at waist/thigh hem.
 if .81<vy<1.015:
  f=smooth(.81,.835,vy)*(1-smooth(.995,1.015,vy))
  colors[i]=np.array([1,1,1])*(1-f)+np.array([.09,.13,.19])*f
 # Coral anatomical highlight follows the actual pectoral surface, not an overlay plane.
 chest=((abs(vx)-.105)/.105)**2+((vy-1.365)/.073)**2
 if vz>.106 and chest<1:
  f=(1-smooth(.78,1,chest))*smooth(.106,.126,vz)
  colors[i]=np.array([1.,1.,1.])*(1-f)+np.array([1.,.27,.20])*f
arrays={'position':verts.astype('<f4'),'color':colors.astype('<f4'),'skinIndex':ids.astype('<u2'),'skinWeight':weights.astype('<f4'),'index':faces.astype('<u4').reshape(-1)}
meta={'rest':rest,'attributes':{},'vertices':len(verts),'triangles':len(faces)};data=bytearray()
for name,arr in arrays.items():
 while len(data)%4:data.append(0)
 meta['attributes'][name]={'offset':len(data),'length':arr.size,'itemSize':1 if name=='index' else arr.shape[1],'type':str(arr.dtype)};data+=arr.tobytes()
(out/'body.bin').write_bytes(data);(out/'body.json').write_text(json.dumps(meta,separators=(',',':'))+'\n')
print(meta['vertices'],meta['triangles'],len(data))
