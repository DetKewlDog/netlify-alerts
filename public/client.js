window.onload = () => {
    const webhook = localStorage.getItem('webhook');
    if (!webhook) return;
    document.querySelector('#url').textContent = `${location.href}push/${webhook}`;
}

async function copyToClipboard() {
    const content = document.querySelector('#url').textContent;
    if (!content) return;
    await navigator.clipboard.writeText(content)
    let banner = document.querySelector(".copy-banner");
    banner.classList.add('show');
    setTimeout(() => {
        banner.classList.remove('show');
    }, 2000);
}

const subscribe = () => handleSubscription('/subscribe');
const unsubscribe = () => handleSubscription('/unsubscribe');

async function handleSubscription(href) {
    if (Notification.permission !== "granted") await Notification.requestPermission();
    if (Notification.permission !== "granted") {
        alert("Please allow notifications.");
        return;
    }
    document.body.classList.add('cursor-wait');
    try { await regWorker(href); }
    catch (err) { console.error(err); }
    finally { document.body.classList.remove('cursor-wait'); }
};

async function generateSubscriptionId(subscription) {
    const data = new TextEncoder().encode(JSON.stringify({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh
    }));
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(byte => ('00' + byte.toString(16)).slice(-2))
        .join('');
}

async function regWorker(href) {
    const publicKey = "BJUn3bqZBNcSuV5BA7ovr5MdNoZzKFFJTx8qwJdglDrkn3B2n0NKlNA-ztfkCJRHjYDHUSqsyspJZdVbApH0lio";
    navigator.serviceWorker.register("sw.js", { scope: "/" });
    const serviceWorker = await navigator.serviceWorker.ready;
    const subscription = await serviceWorker.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
    });

    const subscriptionId = await generateSubscriptionId(subscription.toJSON());
    await fetch(`${href}/${subscriptionId}`, {
        method: "POST",
        body: JSON.stringify(subscription.toJSON()),
        headers: { "content-type": "application/json" }
    });

    document.querySelector('#url').textContent = href === '/subscribe' ? `${location.href}push/${subscriptionId}` : '';
    localStorage.setItem('webhook', href === '/subscribe' ? subscriptionId : '');
}