// Atajo para obtener un elemento por id.
export function $(id) {
  return document.getElementById(id);
}

// Crea un elemento HTML.
export function create(tag) {
  return document.createElement(tag);
}

// Limpia el contenido de un contenedor.
export function clear(element) {
  element.innerHTML = "";
}
