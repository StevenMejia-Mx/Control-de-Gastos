const CLAVE_STORAGE = "control-gastos";
const categorias = ["comida", "transporte", "escuela", "servicios", "otros"];

let gastos = [];
let idEditando = null;

const formulario = document.getElementById("formulario");
const inputConcepto = document.getElementById("concepto");
const inputMonto = document.getElementById("monto");
const selectCategoria = document.getElementById("categoria");
const inputFecha = document.getElementById("fecha");
const mensaje = document.getElementById("mensaje");
const btnGuardar = document.getElementById("btn-guardar");
const btnCancelar = document.getElementById("btn-cancelar");

const inputBuscar = document.getElementById("buscar");
const selectFiltrar = document.getElementById("filtrar");
const tablaGastos = document.getElementById("lista-gastos");
const totalTexto = document.getElementById("total");
const contadorTexto = document.getElementById("contador");
const sinRegistros = document.getElementById("sin-registros");

let temporizadorMensaje = null;

const formatearMoneda = (cantidad) =>
    cantidad.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const formatearFecha = (fecha) => {
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
};

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

const escaparHTML = (texto) =>
    texto
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

const fechaDeHoy = () => {
    const hoy = new Date();
    hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    return hoy.toISOString().slice(0, 10);
};

function guardarEnStorage() {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(gastos));
}

function cargarDeStorage() {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_STORAGE));
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        return [];
    }
}

function mostrarMensaje(texto, tipo) {
    clearTimeout(temporizadorMensaje);
    mensaje.textContent = texto;
    mensaje.className = `mensaje ${tipo}`;

    if (tipo === "exito") {
        temporizadorMensaje = setTimeout(() => {
            mensaje.textContent = "";
            mensaje.className = "mensaje";
        }, 3000);
    }
}

function marcarCampo(campo, esInvalido) {
    campo.closest(".campo").classList.toggle("invalido", esInvalido);
}

function limpiarErrores() {
    [inputConcepto, inputMonto, selectCategoria, inputFecha].forEach((campo) => marcarCampo(campo, false));
}

function validarFormulario() {
    limpiarErrores();

    const concepto = inputConcepto.value.trim();
    const monto = Number(inputMonto.value);
    const categoria = selectCategoria.value;
    const fecha = inputFecha.value;
    const errores = [];

    if (concepto === "") {
        errores.push({ campo: inputConcepto, texto: "Escribe el concepto del gasto." });
    } else if (concepto.length < 3 || concepto.length > 50) {
        errores.push({ campo: inputConcepto, texto: "El concepto debe tener entre 3 y 50 caracteres." });
    }

    if (inputMonto.value === "") {
        errores.push({ campo: inputMonto, texto: "Escribe el monto del gasto." });
    } else if (Number.isNaN(monto) || monto <= 0) {
        errores.push({ campo: inputMonto, texto: "El monto debe ser un número mayor que 0." });
    } else if (monto > 1000000) {
        errores.push({ campo: inputMonto, texto: "El monto no puede ser mayor a $1,000,000." });
    }

    if (!categorias.includes(categoria)) {
        errores.push({ campo: selectCategoria, texto: "Selecciona una categoría." });
    }

    if (fecha === "") {
        errores.push({ campo: inputFecha, texto: "Selecciona la fecha del gasto." });
    } else if (fecha > fechaDeHoy()) {
        errores.push({ campo: inputFecha, texto: "La fecha no puede ser futura." });
    }

    if (errores.length > 0) {
        errores.forEach((error) => marcarCampo(error.campo, true));
        mostrarMensaje(errores[0].texto, "error");
        errores[0].campo.focus();
        return null;
    }

    return {
        concepto,
        monto: Math.round(monto * 100) / 100,
        categoria,
        fecha
    };
}

function obtenerGastosVisibles() {
    const textoBuscado = inputBuscar.value.trim().toLowerCase();
    const categoriaFiltro = selectFiltrar.value;

    return gastos
        .filter((gasto) => gasto.concepto.toLowerCase().includes(textoBuscado))
        .filter((gasto) => categoriaFiltro === "todas" || gasto.categoria === categoriaFiltro)
        .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
}

function mostrarGastos() {
    const visibles = obtenerGastosVisibles();

    tablaGastos.innerHTML = visibles
        .map((gasto) => `
            <tr>
                <td>${formatearFecha(gasto.fecha)}</td>
                <td>${escaparHTML(gasto.concepto)}</td>
                <td><span class="etiqueta-categoria">${capitalizar(gasto.categoria)}</span></td>
                <td class="monto">${formatearMoneda(gasto.monto)}</td>
                <td class="acciones">
                    <button type="button" data-accion="editar" data-id="${gasto.id}" title="Editar" aria-label="Editar">✏️</button>
                    <button type="button" data-accion="eliminar" data-id="${gasto.id}" title="Eliminar" aria-label="Eliminar">🗑️</button>
                </td>
            </tr>
        `)
        .join("");

    const total = visibles.reduce((suma, gasto) => suma + gasto.monto, 0);
    totalTexto.textContent = formatearMoneda(total);
    contadorTexto.textContent = visibles.length;

    if (gastos.length === 0) {
        sinRegistros.textContent = "Aún no hay gastos registrados.";
        sinRegistros.hidden = false;
    } else if (visibles.length === 0) {
        sinRegistros.textContent = "No hay gastos que coincidan con tu búsqueda.";
        sinRegistros.hidden = false;
    } else {
        sinRegistros.hidden = true;
    }
}

function reiniciarFormulario() {
    formulario.reset();
    inputFecha.value = fechaDeHoy();
    idEditando = null;
    btnGuardar.textContent = "Guardar";
    btnCancelar.hidden = true;
    limpiarErrores();
}

function agregarGasto(datos) {
    const nuevoGasto = { id: Date.now(), ...datos };
    gastos.push(nuevoGasto);
}

function actualizarGasto(id, datos) {
    const indice = gastos.findIndex((gasto) => gasto.id === id);
    if (indice !== -1) {
        gastos[indice] = { ...gastos[indice], ...datos };
    }
}

function empezarEdicion(id) {
    const gasto = gastos.find((g) => g.id === id);
    if (!gasto) return;

    idEditando = id;
    inputConcepto.value = gasto.concepto;
    inputMonto.value = gasto.monto;
    selectCategoria.value = gasto.categoria;
    inputFecha.value = gasto.fecha;

    btnGuardar.textContent = "Actualizar";
    btnCancelar.hidden = false;
    limpiarErrores();
    mostrarMensaje("Editando gasto. Haz los cambios y presiona Actualizar.", "exito");
    inputConcepto.focus();
}

function eliminarGasto(id) {
    const gasto = gastos.find((g) => g.id === id);
    if (!gasto) return;

    const confirmado = confirm(`¿Eliminar el gasto "${gasto.concepto}"?`);
    if (!confirmado) return;

    gastos = gastos.filter((g) => g.id !== id);
    guardarEnStorage();

    if (idEditando === id) {
        reiniciarFormulario();
    }

    mostrarGastos();
    mostrarMensaje("Gasto eliminado.", "exito");
}

formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = validarFormulario();
    if (!datos) return;

    if (idEditando === null) {
        agregarGasto(datos);
        mostrarMensaje("Gasto agregado correctamente.", "exito");
    } else {
        actualizarGasto(idEditando, datos);
        mostrarMensaje("Gasto actualizado correctamente.", "exito");
    }

    guardarEnStorage();
    reiniciarFormulario();
    mostrarGastos();
});

btnCancelar.addEventListener("click", () => {
    reiniciarFormulario();
    mostrarMensaje("Edición cancelada.", "exito");
});

[inputConcepto, inputMonto, selectCategoria, inputFecha].forEach((campo) => {
    campo.addEventListener("input", () => marcarCampo(campo, false));
});

tablaGastos.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    const id = Number(boton.dataset.id);

    if (boton.dataset.accion === "editar") {
        empezarEdicion(id);
    } else if (boton.dataset.accion === "eliminar") {
        eliminarGasto(id);
    }
});

inputBuscar.addEventListener("input", mostrarGastos);
selectFiltrar.addEventListener("change", mostrarGastos);

gastos = cargarDeStorage();
inputFecha.value = fechaDeHoy();
inputFecha.max = fechaDeHoy();
mostrarGastos();
