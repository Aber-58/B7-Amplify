


First create the titles for each cluster/circle
```
http://127.0.0.1:4200/api/clusters/5b1d2312-c6a4-43bd-a7ea-bf7996d6a57f
```

Then you can request the sizes of each circle
```
http://127.0.0.1:4200/api/get_circle_sizes/5b1d2312-c6a4-43bd-a7ea-bf7996d6a57f
```

Add new msgs using this
```
curl -X POST http://127.0.0.1:4200/api/chat/add      -H "Content-Type: application/json"      -d '{"message": "LV3  LOVE LOVE BIKES!"}'
```

Get the last 5 msgs using
```
http://127.0.0.1:4200/api/chat/last/5
```

You can process the currently saved msgs using this, when theres less than 5 it doesnt do anything
```
curl -X POST http://127.0.0.1:4200/api/update_ball_sizes/5b1d2312-c6a4-43bd-a7ea-bf7996d6a57f

```