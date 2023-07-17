
require('dotenv').config();
const port = 80,
    mail = process.env.MAIL,
    publicKey = process.env.PUBLIC_KEY,
    privateKey = process.env.PRIVATE_KEY,
    supabaseUrl = process.env.SUPABASE_URL,
    supabaseKey = process.env.SUPABASE_KEY;

const express = require("express"),
    bodyParser = require("body-parser"),
    path = require("path"),
    webpush = require("web-push"),
    { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.static(__dirname));
app.use(bodyParser.json());

const supabase = createClient(supabaseUrl, supabaseKey)
webpush.setVapidDetails("mailto:" + mail, publicKey, privateKey);

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "/index.html")));

app.post("/subscribe/:id", async (req, res) => {
    const { id } = req.params;
    const sub = JSON.stringify(req.body);
    await supabase.from('subscriptions')
        .upsert([{ id: id, subscription: sub }]);
    res.status(201).json({});
});

app.post("/unsubscribe/:id", async (req, res) => {
    const { id } = req.params;
    await supabase.from('subscriptions')
        .delete()
        .eq('id', id);
    res.status(201).json({});
});

app.post("/push/:id", async (req, res) => {
    const { id } = req.params;
    const { data } = await supabase.from('subscriptions')
        .select('subscription')
        .eq('id', id)
        .single();
    if (!data) return;
    res.status(201).json({});
    const subscription = JSON.parse(data['subscription']);
    const body = req.body;
    const strToTitle = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    webpush.sendNotification(subscription,
        JSON.stringify({
            title: title = `Published deploy for ${body.name}`,
            body: `${strToTitle(body.context)}: ${body.branch}@${body.commit_ref.substring(0, 7)}\n${body.title}`,
            icon: "https://cdn.freebiesupply.com/logos/large/2x/netlify-logo-png-transparent.png",
            data: {
                url: body.url
            }
        })
    ).catch(err => console.log(err));
});

app.listen(port, () => console.log(`Server deployed at ${port}`));
