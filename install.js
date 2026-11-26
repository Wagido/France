/* Bouton « Installer l'appli » : Android/Chrome/Edge (événement beforeinstallprompt) ; iPhone/iPad : explication Safari */
(() => {
"use strict";
const btn = document.getElementById("install-btn"); if (!btn) return;
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
if (standalone) return;                                   // déjà installée
let evt = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); evt = e; btn.hidden = false; });
addEventListener("appinstalled", () => { btn.hidden = true; evt = null; });
const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
const inApp = /FBAN|FBAV|Instagram|Line\/|GSA\/|; wv\)|WhatsApp|Snapchat/i.test(ua);
const aide = () => {
  if (inApp) return "Ce site est ouvert dans le navigateur intégré d'une autre application, qui ne permet pas l'installation. Ouvrez-le dans Chrome (Android) ou Safari (iPhone) : menu, puis « Ouvrir dans le navigateur ».";
  if (ios) return "Sur iPhone et iPad, l'installation se fait depuis Safari : touchez le bouton Partager (le carré avec une flèche vers le haut), puis « Sur l'écran d'accueil ».";
  return "Ouvrez le menu du navigateur (⋮ en haut à droite dans Chrome), puis « Installer l'application » ou « Ajouter à l'écran d'accueil ». Si l'option n'apparaît pas, ouvrez le site dans Chrome.";
};
// iPhone, ou navigateur intégré : pas d'événement, on affiche quand même le bouton avec l'explication
if ((ios || inApp) && matchMedia("(max-width: 900px)").matches) btn.hidden = false;
btn.addEventListener("click", async () => {
  if (evt) { evt.prompt(); try { await evt.userChoice; } catch (e) {} evt = null; btn.hidden = true; return; }
  alert(aide());
});
})();
