## Activate Test Number
```
curl 'https://graph.facebook.com/v22.0/<phone number id>/register ' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer '<bearer token>' \
-d '{
  "messaging_product": "whatsapp",
  "pin": "111111"
}'
```
[Link to stack overflow](https://stackoverflow.com/questions/78348741/the-account-does-not-exist-in-the-cloud-api-whatsapp-business-api-problem-wi)

## Generate Access Token
[Here](https://developers.facebook.com/apps/1538399234278771/whatsapp-business/wa-dev-console/?business_id=1153952982897352)