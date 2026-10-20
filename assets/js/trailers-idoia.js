/* Vídeos de R2. El gestor los incorpora a info.txt al publicar cambios. */
(function () {
  const version = "2026-10-20-r2-v3";
  const versionAnterior = "2026-10-20-r2-v2";
  const base = "https://pub-e2d83271dfc84a8c9dac040cb75b4f25.r2.dev/";
  const r2 = (archivo) => base + archivo;
  const proyecto = (tipo, carpeta, titulo, videos = [], nuevoEn = versionAnterior) => ({ tipo, carpeta, titulo, nuevoEn, videos });
  const extra = (tipo, titulo, videos = [], nuevoEn = versionAnterior) => ({ tipo, titulo, nuevoEn, video: videos.join("\n") });

  const aMilKm = r2("A%201000km%20De%20La%20Navidad%20(2021)%20Netflix%20Tr%C3%A1iler%20Oficial%20Espa%C3%B1ol%20%5BCQG-6hpGvn4%5D_WEB_WEB_WEB.mp4");
  const asisa = r2("ASISA%20Irreemplazable%20-%20%20spot%2045%E2%80%9D%20%5BBFk-iYM8izM%5D_WEB.mp4");
  const volkswagen = r2("Feliz%20D%C3%ADa%20del%20Padre.mp4");
  const samsung = [
    r2("Copiloto%20Samsung%20-%20Tecnolog%C3%ADa%20Con%20Prop%C3%B3sito%20%5BysnWjDsooIY%5D_WEB_WEB.mp4"),
    r2("Copiloto%20Samsung%20-%20Tecnolog%C3%ADa%20con%20Prop%C3%B3sito%20%5BJYMYWqMueys%5D_WEB_WEB_WEB.mp4"),
    r2("Copiloto%20Samsung%20-%20Tencolog%C3%ADa%20con%20Prop%C3%B3sito%20%5B5kwsJYWQeLw%5D_WEB_WEB.mp4"),
  ];
  const vidal = [
    r2("Dipper%20Experiencia%20N%C2%BA%20263%20-%20The%20Implosion%20(Spot%20Dipper%20Ball%202019)%20%5BsvadQ81RYdY%5D_WEB_WEB_WEB.mp4"),
    r2("Mi%20Querido%20Watson%20-%20Spot%E2%A7%B8Anuncio%20Golosinas%20Vidal%20Dipper%20Experiencia%20N%C2%BA%20375%20%5ByssygR3t64Q%5D_WEB_WEB_WEB.mp4"),
    r2("%E2%80%98El%20sabor%20m%C3%A1s%20inesperado%E2%80%99%2C%20de%20Mi%20Querido%20Watson%20para%20Vidal%20%5BurE4AQHbXs0%5D_WEB_WEB_WEB.mp4"),
  ];
  const twyp = [
    r2("ANUNCIO%20TWYP%20%20ING%20DIRECT%20TVEO%20%5BJXf_yeHGWpc%5D_WEB_WEB_WEB.mp4"),
    r2("TWYP%20%20%20Publicidad%20%20%20Eduardo%20Casanova%20%5B0mhJvMI8ls0%5D_WEB_WEB_WEB.mp4"),
    r2("TWYP%20%20%20Publicidad%20%20%20Eduardo%20Casanova%20%5Brh8lbgdzQLU%5D_WEB_WEB_WEB.mp4"),
    r2("TWYP%20-%20Publicidad%20-%20Eduardo%20Casanova%20%5BXrzVnebpR2g%5D_WEB_WEB_WEB.mp4"),
  ];

  window.TRAILERS_IMPORT = {
    version,
    versiones: ["2026-10-19-vimeo", "2026-10-19-vimeo-v2", "2026-10-20-r2-v1", versionAnterior, version],
    proyectos: [
      proyecto("films", "salitre", "Salitre", [r2("Salitre%20-%20Trailer%20%5BgTY3GEnZl6M%5D_WEB_WEB_WEB.mp4")]),
      proyecto("films", "a-mil-km-de-la-navidad", "A mil km de la Navidad", [aMilKm]),
      proyecto("films", "rainbow", "Rainbow", [r2("Rainbow_Trailer_oficial_Netflix_youtube_33nxp8T5orc_web.mp4")], version),
      proyecto("comercials", "2021-vidal", "Vidal", vidal),
      proyecto("films", "si-yo-fuera-rico", "Si yo fuera rico", [r2("Si%20Yo%20Fuera%20Rico%20%EF%BD%9C%20Trailer%20%EF%BD%9C%20Paramount%20Pictures%20Spain%20%5BbJ3NHGKXEq0%5D_WEB_WEB_WEB.mp4")]),
      proyecto("films", "en-las-estrellas", "En las estrellas", [r2("En%20las%20estrellas%20-%20Trailer%20(HD)%20%5BeTCQx5vYjYc%5D_WEB_WEB_WEB.mp4")]),
      proyecto("series", "arde-madrid", "Arde Madrid", [r2("Arde%20Madrid%EF%BC%9A%20Tr%C3%A1iler%20%EF%BD%9C%20Movistar%2B%20%5BAJmV7QHGGiM%5D_WEB_WEB_WEB.mp4")]),
      proyecto("comercials", "twyp", "ING Twyp", twyp),
      proyecto("comercials", "stranger-things", "Stranger Things", [r2("Leticia%20Sabater%20llega%20al%20Upside%20Down%20%EF%BD%9C%20Stranger%20Things%20%EF%BD%9C%20Netflix%20Espa%C3%B1a%20%5BmpXcM61rmuI%5D_WEB_WEB_WEB.mp4")]),
      proyecto("films", "que-baje-dios-y-lo-vea", "Que baje Dios y lo vea", [r2("Que%20baje%20Dios%20y%20lo%20vea%20-%20Trailer%20(HD)%20%5BgTb0ApAlQ9c%5D_WEB_WEB_WEB.mp4")]),
      proyecto("films", "pieles", "Pieles", [r2("PIELES%20I%20TR%C3%81ILER%20OFICIAL%20%5B8Ik0Lt8FFBA%5D_WEB_WEB_WEB.mp4")]),
      proyecto("films", "la-piedad", "La piedad", [r2("LA%20PIEDAD%20-%20TR%C3%81ILER%20OFICIAL%20(HD)%20%5BZtSngOS_6mo%5D_WEB_WEB_WEB.mp4")]),
      proyecto("comercials", "amstel-radler", "Amstel Radler", [], version),
      proyecto("comercials", "vodafone-one-profesional", "Vodafone One Profesional", [], version),
      proyecto("comercials", "2017-volkswagen", "Volkswagen", [volkswagen], version),
      proyecto("films", "los-miercoles-no-existen", "Los miércoles no existen", [r2("Los%20Miercoles%20No%20Existen%20-%20Trailer%20largo%20HD%20%5Bn_qx0_l7S1I%5D_WEB_WEB_WEB.mp4")]),
      proyecto("films", "extraterrestre", "Extraterrestre", [r2("Extraterrestre%20-%20Trailer%20%5BEiNOSJY4A3Q%5D_WEB_WEB_WEB.mp4")]),
      proyecto("comercials", "lo-siento-mi-amor", "Lo siento mi amor"),
      proyecto("comercials", "2026-samsung", "Samsung", samsung),
      proyecto("comercials", "2024-asisa", "Asisa", [asisa], version),
      proyecto("films", "maridos", "Maridos", [r2("Mari(Dos)%20(2023)%20Tr%C3%A1iler%20Oficial%20Espa%C3%B1ol%20%5BrI7OvhsKtKc%5D_WEB_WEB_WEB.mp4")]),
      proyecto("films", "daniela-forever", "Daniela Forever", [r2("DANIELA%20FOREVER%20Tr%C3%A1iler%20Oficial%20Espa%C3%B1ol%20(2025)%20%5Bdbfo_r-694c%5D_WEB_WEB_WEB.mp4")]),
      proyecto("series", "superestar", "Superestar", [r2("Superestar%20%EF%BD%9C%20Tr%C3%A1iler%20Oficial%20%EF%BD%9C%20Netflix%20Espa%C3%B1a%20%5Bh75xrfq-SBE%5D_WEB_WEB_WEB.mp4")]),
      proyecto("films", "aida-y-vuelta", "Aída y vuelta", [r2("Aida%20Y%20Vuelta%20%EF%BD%9C%20Tr%C3%A1iler%20Oficial%20HD.%20En%20cines%2030%20de%20enero.%20%5BO82ibLC4bmM%5D_WEB.mp4")], version),
    ],
    extras: [
      extra("comercials", "Vidal - Dipper", vidal),
      extra("comercials", "Volkswagen - Día del padre", [volkswagen], version),
      extra("comercials", "Samsung - Copiloto", samsung),
    ],
  };
})();
