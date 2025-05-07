let recordatoriosPorDia = {};
let mesActual = new Date().getMonth();
let anioActual = new Date().getFullYear();
let historialPantallas = [];
let listaDeCompras = [];

function mostrarPantalla(id) {
  const pantallas = document.querySelectorAll(".pantalla");
  pantallas.forEach(p => {
    p.classList.remove("visible");
    setTimeout(() => p.style.display = "none", 300);
  });

  const pantallaActiva = document.getElementById(id);
  pantallaActiva.style.display = "flex";
  setTimeout(() => pantallaActiva.classList.add("visible"), 10);

  if (!historialPantallas.length || historialPantallas[historialPantallas.length - 1] !== id) {
    historialPantallas.push(id);
  }

  document.querySelectorAll(".back-btn").forEach(btn => btn.remove());

  if (id !== "pantallaHome" && id !== "pantallaLogin" && id !== "pantallaSplash") {
    const backBtn = document.createElement("div");
    backBtn.className = "back-btn";
    backBtn.innerText = "←";
    backBtn.onclick = () => volverAtras();
    document.body.appendChild(backBtn);
  }

  if (id === "pantallaChat") iniciarConversacion();
  if (id === "pantallaCalendario") crearCalendarioMensual();
  if (id === "pantallaRecetas") mostrarRecetas();
  if (id === "pantallaListaCompras") mostrarListaCompras();
}

function volverAtras() {
  if (historialPantallas.length > 1) {
    historialPantallas.pop();
    const anterior = historialPantallas.pop();
    mostrarPantalla(anterior || "pantallaHome");
  } else {
    mostrarPantalla("pantallaHome");
  }
}

// =====================
// CALENDARIO
// =====================

function crearCalendarioMensual() {
  const container = document.getElementById("recordatoriosGuardados");
  container.innerHTML = "";

  const primerDia = new Date(anioActual, mesActual, 1);
  const ultimoDia = new Date(anioActual, mesActual + 1, 0);
  const diasMes = ultimoDia.getDate();
  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const tituloMes = document.getElementById("tituloMes");
  if (tituloMes) {
    tituloMes.innerText = primerDia.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  }

  let html = "<table class='calendario-visual'><thead><tr>";
  diasSemana.forEach(d => html += `<th>${d}</th>`);
  html += "</tr></thead><tbody><tr>";

  for (let i = 0; i < primerDia.getDay(); i++) html += "<td></td>";

  let dia = 1;
  let diaSemana = primerDia.getDay();

  while (dia <= diasMes) {
    const fechaISO = `${anioActual}-${(mesActual + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
    const tieneRecordatorio = recordatoriosPorDia[fechaISO]?.length > 0;
    const esHoy = fechaISO === new Date().toISOString().split("T")[0];
    html += `<td><div class="dia-celda${esHoy ? ' dia-hoy' : ''}" onclick="verDiaSeleccionado('${fechaISO}')">` +
            `<div class="numero-dia">${dia}</div>` +
            (tieneRecordatorio ? '<div class="icono-alerta">🔔</div>' : '') +
            `</div></td>`;
    dia++;
    diaSemana++;
    if (diaSemana > 6 && dia <= diasMes) {
      html += "</tr><tr>";
      diaSemana = 0;
    }
  }

  while (diaSemana <= 6 && diaSemana !== 0) {
    html += "<td></td>";
    diaSemana++;
  }

  html += "</tr></tbody></table>";
  container.innerHTML = html;
}

function cambiarMes(direccion) {
  mesActual += direccion;
  if (mesActual > 11) {
    mesActual = 0;
    anioActual++;
  } else if (mesActual < 0) {
    mesActual = 11;
    anioActual--;
  }
  crearCalendarioMensual();
}

function verDiaSeleccionado(fechaISO) {
  mostrarPantalla("pantallaDia");
  document.getElementById("tituloDia").innerText = `📌 Recordatorios del ${fechaISO}`;
  document.getElementById("horaRecordatorio").value = "";
  document.getElementById("textoRecordatorio").value = "";

  const lista = document.getElementById("listaRecordatorios");
  lista.innerHTML = "";
  lista.dataset.fecha = fechaISO;

  const recordatorios = recordatoriosPorDia[fechaISO] || [];
  recordatorios.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item-recordatorio";
    div.innerHTML = `
      <span>${item.hora} - ${item.texto}</span>
      <div class="acciones-recordatorio">
        <button onclick="editarRecordatorio('${fechaISO}', ${index})">✏️</button>
        <button onclick="eliminarRecordatorio('${fechaISO}', ${index})">🗑️</button>
      </div>
    `;
    lista.appendChild(div);      
  });
}

function eliminarRecordatorio(fecha, index) {
  const confirmar = confirm("¿Estás seguro de que querés eliminar este recordatorio?");
  if (!confirmar) return;

  const lista = document.getElementById("listaRecordatorios");
  const divs = lista.querySelectorAll("div");
  const divEliminar = divs[index];
  divEliminar.classList.add("recordatorio-eliminado");

  setTimeout(() => {
    if (recordatoriosPorDia[fecha]) {
      recordatoriosPorDia[fecha].splice(index, 1);
      if (recordatoriosPorDia[fecha].length === 0) {
        delete recordatoriosPorDia[fecha];
      }
      verDiaSeleccionado(fecha);
      crearCalendarioMensual();
      mostrarMensaje("Recordatorio eliminado");
    }
  }, 400);
}

function editarRecordatorio(fecha, index) {
  const recordatorio = recordatoriosPorDia[fecha]?.[index];
  if (!recordatorio) return;

  const nuevoTexto = prompt("Editá el recordatorio:", recordatorio.texto);
  if (nuevoTexto !== null) {
    const nuevoTextoLimpio = nuevoTexto.trim();
    if (nuevoTextoLimpio) {
      recordatoriosPorDia[fecha][index].texto = nuevoTextoLimpio;
      verDiaSeleccionado(fecha);
    }
  }
}

function agregarRecordatorioDia() {
  const fecha = document.getElementById("listaRecordatorios").dataset.fecha;
  const hora = document.getElementById("horaRecordatorio").value;
  const texto = document.getElementById("textoRecordatorio").value.trim();

  if (!hora || !texto) {
    alert("Completá la hora y el recordatorio.");
    return;
  }

  if (!recordatoriosPorDia[fecha]) recordatoriosPorDia[fecha] = [];
  recordatoriosPorDia[fecha].push({ hora, texto });

  verDiaSeleccionado(fecha);
  crearCalendarioMensual();
}

// =====================
// RECETAS Y LISTA DE COMPRAS
// =====================

const recetas = [
    {
      titulo: "Pasta cremosa con ajo",
      descripcion: "Ideal para una cena rápida y deliciosa. Bajo en sodio.",
      imagen: "https://source.unsplash.com/featured/?pasta",
      ingredientes: ["Pasta", "Ajo", "Crema", "Perejil"]
    },
    {
      titulo: "Ensalada de quinoa",
      descripcion: "Refrescante y liviana. Perfecta para el almuerzo.",
      imagen: "https://source.unsplash.com/featured/?salad",
      ingredientes: ["Quinoa", "Tomate", "Pepino", "Limón"]
    },
    {
      titulo: "Tostadas con palta",
      descripcion: "Desayuno energético y saludable. Listo en 5 minutos.",
      imagen: "https://source.unsplash.com/featured/?avocado",
      ingredientes: ["Pan", "Palta", "Aceite de oliva", "Sal"]
    }
  ];
  
  function mostrarRecetas() {
    const contenedor = document.getElementById("contenedorRecetas");
    contenedor.innerHTML = "";
  
    recetas.forEach(receta => {
      const tarjeta = document.createElement("div");
      tarjeta.className = "tarjeta-receta";
      tarjeta.innerHTML = `
        <img src="${receta.imagen}" alt="${receta.titulo}">
        <h3>${receta.titulo}</h3>
        <p>${receta.descripcion}</p>
        <button class="btn-compras">Agregar a compras</button>
      `;
      const boton = tarjeta.querySelector("button");
      boton.onclick = () => agregarAListaCompras(receta.ingredientes);
      contenedor.appendChild(tarjeta);
    });
  }
  function abrirListaCompras() {
    mostrarPantalla("pantallaListaCompras");
    mostrarListaCompras();
  }
  
  function agregarAListaCompras(ingredientes) {
    ingredientes.forEach(item => {
      if (!listaDeCompras.includes(item)) {
        listaDeCompras.push(item);
      }
    });
    mostrarMensaje("Ingredientes agregados a tu lista");
  }
  
  function mostrarListaCompras() {
    const contenedor = document.getElementById("listaCompras");
    contenedor.innerHTML = "";
  
    if (listaDeCompras.length === 0) {
      contenedor.innerHTML = "<li>Tu lista está vacía</li>";
      return;
    }
  
    listaDeCompras.forEach((item, index) => {
      const li = document.createElement("li");
      li.innerText = item;
      li.onclick = () => eliminarDeLista(index);
      contenedor.appendChild(li);
    });
  }
  
  function eliminarDeLista(index) {
    listaDeCompras.splice(index, 1);
    mostrarListaCompras();
  }
  
  function mostrarMensaje(texto) {
    const msg = document.createElement("div");
    msg.className = "mensaje-popup";
    msg.innerText = texto;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
  }

// =====================
// LOGIN / SPLASH
// =====================

window.onload = () => {
  mostrarPantalla("pantallaSplash");
  setTimeout(() => {
    const emailGuardado = localStorage.getItem("emailUsuario");
    if (emailGuardado) {
      mostrarPantalla("pantallaHome");
    } else {
      mostrarPantalla("pantallaLogin");
    }
  }, 2000);
};

function ingresar() {
  const email = document.getElementById("emailUsuario").value.trim();
  if (email) {
    localStorage.setItem("emailUsuario", email);
    mostrarPantalla("pantallaHome");
  } else {
    alert("Por favor, ingresá tu email.");
  }
}

function loguearConGoogle() {
  localStorage.setItem("emailUsuario", "googleuser@chef.com");
  mostrarPantalla("pantallaHome");
}

function loguearConFacebook() {
  localStorage.setItem("emailUsuario", "fbuser@chef.com");
  mostrarPantalla("pantallaHome");
}

function cerrarSesion() {
  localStorage.removeItem("emailUsuario");
  mostrarPantalla("pantallaLogin");
}

// =====================
// CHAT IA
// =====================

const apiKey = "sk-xxxx";

let historial = [
  {
    role: "system",
    content: "Sos Chef Luca, un chef simpático y profesional que responde con humor, recomienda recetas, adapta ingredientes y da consejos útiles de cocina."
  }
];

function iniciarConversacion() {
  const chat = document.getElementById("chat");
  chat.innerHTML = "";
  historial = [historial[0]];

  const saludo = document.createElement("div");
  saludo.className = "burbuja chef";
  saludo.innerText = "¡Hola! Soy Chef Luca 👨‍🍳 ¿Qué te gustaría cocinar hoy?";
  chat.appendChild(saludo);
}

async function enviarMensaje() {
  const input = document.getElementById("inputMensaje");
  let mensaje = input.value.trim();
  if (!mensaje) return;

  mensaje = mensaje.charAt(0).toUpperCase() + mensaje.slice(1);
  const chat = document.getElementById("chat");

  const userBubble = document.createElement("div");
  userBubble.className = "burbuja usuario";
  userBubble.innerText = mensaje;
  chat.appendChild(userBubble);

  historial.push({ role: "user", content: mensaje });
  input.value = "";

  const thinking = document.createElement("div");
  thinking.className = "burbuja chef";
  thinking.innerText = "🤔";
  chat.appendChild(thinking);
  chat.scrollTop = chat.scrollHeight;

  try {
    const respuesta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: historial
      })
    });

    const data = await respuesta.json();
    const mensajeIA = data.choices[0].message.content;

    historial.push({ role: "assistant", content: mensajeIA });
    thinking.remove();

    const respuestaFinal = document.createElement("div");
    respuestaFinal.className = "burbuja chef";
    respuestaFinal.innerText = mensajeIA;
    chat.appendChild(respuestaFinal);
    chat.scrollTop = chat.scrollHeight;

  } catch (error) {
    thinking.remove();
    const errorMsg = document.createElement("div");
    errorMsg.className = "burbuja chef";
    errorMsg.innerText = "😕 Hubo un error al contactar con el chef IA.";
    chat.appendChild(errorMsg);
  }
}

document.addEventListener("keydown", function (e) {
  const chatActivo = document.getElementById("pantallaChat");
  const input = document.getElementById("inputMensaje");
  if (
    e.key === "Enter" &&
    chatActivo &&
    chatActivo.classList.contains("visible") &&
    document.activeElement === input
  ) {
    enviarMensaje();
  }
});