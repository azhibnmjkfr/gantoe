let deferredPrompt=null;
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch((e)=>console.warn(e));});}
window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredPrompt=e;const b=document.getElementById('install-btn');if(b)b.style.display='inline-flex';});
export function promptInstall(){if(!deferredPrompt){alert('Gunakan menu browser untuk memasang aplikasi ini (Add to Home Screen).');return;}deferredPrompt.prompt();deferredPrompt.userChoice.then(()=>{deferredPrompt=null;});}
export function isInstalled(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;}
