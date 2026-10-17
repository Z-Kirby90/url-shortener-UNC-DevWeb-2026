// Origine de l'API v2. Laisser "/" quand ce fichier est servi par le
// même serveur Express que l'API (cas par défaut du TP).
// Pour tester avec un serveur statique séparé (ex. `python -m http.server`),
// remplacer par : const originURL = "http://127.0.0.1:8080/";
const originURL = "/";

const form = document.getElementById("submit-link");
const urlInput = document.getElementById("url");
const errorBox = document.getElementById("error");
const resultBox = document.getElementById("result");
const shortLink = document.getElementById("short-link");
const shortCode = document.getElementById("short-code");
const copyBtn = document.getElementById("copy-btn");
const feedback_output = document.getElementById("link_create_feedback");
const submitBtn = document.getElementById("submitBtn");

//provient d'un projet personelle, inspiré de la fonction du même nom en LUA
async function wait(time) {
  await new Promise(res => setTimeout(res,time))
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = "block";
  resultBox.style.display = "none";
}

function showResult(link) {
  const fullShortUrl = `${originURL}api-v2/${link.url}`;
  shortLink.href = fullShortUrl;
  shortCode.textContent = fullShortUrl;
  resultBox.style.display = "block";
  errorBox.style.display = "none";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const response = await fetch(`${originURL}api-v2/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ url: urlInput.value }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || "Une erreur est survenue");
      return;
    }

    showResult(data);
  } catch (err) {
    showError("Impossible de contacter le serveur");
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shortLink.href);
    const previousLabel = copyBtn.textContent;
    copyBtn.textContent = "Copié !";
    setTimeout(() => (copyBtn.textContent = previousLabel), 1500);
  } catch {
    showError("Impossible de copier le lien dans le presse-papier");
  }
});


const names = ["Arnold","Jean","Patrick","Martin","Zelda","Yvan","Alex","Pierre","Cynthia","Félix","Pierrot"]

function cycle_trough() {
  const max = 10;


  if (feedback_output.children.length >= max) { // Et à cause de ça, il ne faut pas faire de boucle for avec cette fonction
    const oldest = feedback_output.children[0];
    oldest.classList.add("leaving");
    oldest.addEventListener("transitionend", () => oldest.remove(), { once: true });
  }

  const output_message = document.createElement("p");
  output_message.className = "MSG_feedback";
  output_message.textContent = `${names[Math.floor(Math.random() * names.length)]} vient de créer un lien ! 🙋`;
  feedback_output.appendChild(output_message);
}


let failsafe = true;

(async () => {
  while (failsafe) {
    cycle_trough();
    await wait((Math.round((Math.random() * 90)) / 10) * 1000);
  }
})();