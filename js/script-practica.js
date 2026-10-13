const categorias = ["comida", "transporte", "escuela", "servicios", "otros"];

let gastos =[];

gastos.push({ id: 1, concepto: "Tacos con amigos", monto: 150, categoria: "comida", fecha: "2026-10-09" });
gastos.push({ id: 2, concepto: "Uber a la escuela", monto: 85, categoria: "transporte", fecha: "2026-10-10" });
gastos.push({ id: 3, concepto: "Libreta y plumas", monto: 64.5, categoria: "escuela", fecha: "2026-10-11" });

const tablaGastos = document.getElementById("lista-gastos");
const totalTexto = document.getElementById("total");
const contadorTexto = document.getElementById("contador");
const sinRegistros = document.getElementById("sin-registros");

const formatearMoneda = (cantidad) => `$${cantidad.toFixed(2)}`;

const formatearFecha = (fecha) => {
    const partes = fecha.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

function mostrarGastos() {
    let filas = "";
    let total = 0;

    for (const gasto of gastos) {
        filas += `
            <tr>
                <td>${formatearFecha(gasto.fecha)}</td>
                <td>${gasto.concepto}</td>
                <td><span class="etiqueta-categoria">${gasto.categoria}</span></td>
                <td class="monto">${formatearMoneda(gasto.monto)}</td>
                <td class="acciones"></td>
            </tr>
        `;
        total += gasto.monto;
    }

    tablaGastos.innerHTML = filas;
    totalTexto.textContent = formatearMoneda(total);
    contadorTexto.textContent = gastos.length;
    sinRegistros.hidden = gastos.length > 0;
}

mostrarGastos();