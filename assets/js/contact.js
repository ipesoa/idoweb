/* =====================================================================
   CONTACT  ·  un texto y los datos de contacto (nada más)
   ---------------------------------------------------------------------
   contenido/about/info.txt:
       email: ...        telefono: ...        instagram: ...
       ---
       Aquí el texto que quieras (una línea en blanco = párrafo nuevo).
   Sin efectos: el texto sale tal cual.
   Tamaños y ancho de la columna: ajustes.css sección 6
   ===================================================================== */
(function () {
  const ab = Web.about || {};
  const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // 1. el texto (lo que hay después del --- en info.txt)
  const texto = document.getElementById("texto");
  if (ab.texto) texto.innerHTML = Web.parrafos(ab.texto);
  else texto.remove();

  // 2. email, teléfono e instagram (los vacíos no salen)
  const insta = (ab.instagram || "").replace(/^@/, "").trim();
  const lineas = [
    ab.email ? `<a href="mailto:${esc(ab.email)}">${esc(ab.email)}</a>` : "",
    ab.telefono ? `<a href="tel:${esc(ab.telefono.replace(/\s/g, ""))}">${esc(ab.telefono)}</a>` : "",
    insta ? `<a href="https://instagram.com/${esc(insta)}" target="_blank" rel="noopener">@${esc(insta)}</a>` : "",
  ].filter(Boolean);
  document.getElementById("datos").innerHTML = lineas.map((l) => `<p>${l}</p>`).join("");
})();
