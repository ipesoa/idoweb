/* =====================================================================
   MODELO DE COLOR  ·  "Photoshop Difference" dirigido artísticamente
   ---------------------------------------------------------------------
   Este archivo son SOLO DATOS. Si generas un modelo nuevo con tu
   herramienta, pega aquí el JSON entero (entre  = {  y  };  ).
   También se puede probar antes en laboratorio.html (pegar JSON).

   base.letterBlend / borderBlend  → color con el que se hace el Difference
   interpolation.radius            → radio de influencia de cada boya
   letterAnchors / borderAnchors   → boyas: sobre el fondo "bg" la salida
                                     debe ser exactamente "out"
   ===================================================================== */
window.DIFERENCIA_MODELO = {
  "version": 2,
  "model": "photoshop-difference-plus-local-oklab-rbf-corrections",
  "base": {
    "formula": "abs(background_rgb - blend_rgb) per RGB channel",
    "letterBlend": "#FFFFFF",
    "borderBlend": "#18A8FF"
  },
  "interpolation": {
    "space": "OKLab",
    "method": "Gaussian RBF on residual correction",
    "radius": 0.28
  },
  "letterAnchors": [
    { "bg": "#000000", "out": "#FFFFFF" },
    { "bg": "#505050", "out": "#F9FF89" },
    { "bg": "#155045", "out": "#F4FFCD" },
    { "bg": "#A631BA", "out": "#FFF229" },
    { "bg": "#BA6A76", "out": "#47F553" },
    { "bg": "#FF0000", "out": "#83FFF7" },
    { "bg": "#FF06A5", "out": "#FFE600" },
    { "bg": "#E90DFF", "out": "#F8FF9D" },
    { "bg": "#0E03FF", "out": "#F9FF5F" },
    { "bg": "#0EFFEF", "out": "#FF4000" },
    { "bg": "#51FF7B", "out": "#F81145" },
    { "bg": "#79FF43", "out": "#B44DB3" },
    { "bg": "#AAFF2F", "out": "#7A56CA" },
    { "bg": "#FFBC30", "out": "#25D6E6" }
  ],
  "borderAnchors": [
    { "bg": "#000000", "out": "#2613FF" },
    { "bg": "#505050", "out": "#3D56AF" },
    { "bg": "#155045", "out": "#5421FF" },
    { "bg": "#A631BA", "out": "#084892" },
    { "bg": "#BA6A76", "out": "#8500B1" },
    { "bg": "#FF0000", "out": "#353FFF" },
    { "bg": "#FF06A5", "out": "#613B9A" },
    { "bg": "#E90DFF", "out": "#6E6D7C" },
    { "bg": "#0E03FF", "out": "#B20000" },
    { "bg": "#0EFFEF", "out": "#349704" },
    { "bg": "#51FF7B", "out": "#4462A4" },
    { "bg": "#79FF43", "out": "#8C0000" },
    { "bg": "#AAFF2F", "out": "#0F2D7D" },
    { "bg": "#FFBC30", "out": "#6114C3" }
  ]
};
