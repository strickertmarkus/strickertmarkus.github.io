# Apple Pay-inkorgen (budget-pay-inbox-v1.js)

En Genvägar-automation på iPhone ("När jag trycker på något av mina kort") skickar varje
Wallet-köp till Realtime Database. Budgetsidan visar köpen under "Nya köp att sortera" och
inget läggs i budgeten förrän någon godkänner det.

Data: `pay_inbox/<hemlig nyckel>/<push-id> = { amount, merchant, card, who }`
- `amount` text eller tal ("487,00 kr" tolkas i appen), `merchant` text, `card` text (valfri),
  `who` "markus" eller "maja" (styr vilken budgetsida köpet visas på).
- Tidpunkten läses ur push-id:t.
- Inlärda butiker: localStorage/Firebase-nyckeln `pay_merchant_rules`.

Den hemliga nyckeln finns BARA i databasreglerna och i genvägen på telefonerna. Den ska aldrig
checkas in här.

Regelgren (läggs till i Realtime Database → Rules, ersätt NYCKEL):

```json
"pay_inbox": {
  ".read": "auth != null",
  ".write": "auth != null",
  "$token": {
    "$id": {
      ".write": "$token === 'NYCKEL' && !data.exists() && newData.exists()",
      ".validate": "newData.hasChildren(['amount', 'merchant'])",
      "amount": { ".validate": "(newData.isString() && newData.val().length <= 40) || (newData.isNumber() && newData.val() >= 0 && newData.val() < 10000000)" },
      "merchant": { ".validate": "newData.isString() && newData.val().length <= 120" },
      "card": { ".validate": "newData.isString() && newData.val().length <= 60" },
      "who": { ".validate": "newData.isString() && (newData.val() === 'markus' || newData.val() === 'maja')" },
      "$other": { ".validate": false }
    }
  }
}
```
