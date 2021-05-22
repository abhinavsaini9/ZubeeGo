# [ZubeeGo](https://zubeego.herokuapp.com/)

## Semester Project CSN 254

ZubeeGo is a web application designed for all the travellers, vloggers touring an unfamiliar part
of the country, thirsting for some local food, looking for the finest of the hotels, and some
landscapes to visit around the area. It will be based on a vast collection of surveys and reviews
provided by the local people and tourists to provide the user with the best of the options. The
project is to develop an interactive platform where the users can access the maps and select the
location where they want to visit. They can then read the reviews, the guidelines and the
experiences of other visitors and local peoples.

<hr></hr>

### Local Setup
<br>

```
git clone https://github.com/abhinavsaini9/ZubeeGo.git

cd ZubeeGo
```
<br/>
Install npm modules and dependencies for the web application 

`npm install `

<br/>
Define all the Environment variables <br/>

```js
DB_URL
CLIENT_ID
CLIENT_SECRET 
CALLBACK_URL

GEOCODER_API_KEY 

//For CLIENT_ID,CLIENT_SECRET, CALLBACK_URL visit https://console.cloud.google.com/ and setup OAuth Client.

CLOUD_NAME
CLOUD_KEY 
CLOUD_SECRET
```

<br/>

Run the app on localhost.

```js
node index.js

    OR

npm run dev
```






