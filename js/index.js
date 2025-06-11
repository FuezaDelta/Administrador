import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection,
    updateDoc // Importar updateDoc para actualizar solo ciertos campos
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA8HzpUL5LAvOCk6nmZvd_mB2vAB7FSYME",
    authDomain: "fuerza-delta.firebaseapp.com",
    projectId: "fuerza-delta",
    storageBucket: "fuerza-delta.appspot.com",
    messagingSenderId: "273501560145",
    appId: "1:273501560145:web:e6f01a832b054e01e1c770"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById("fechaNacimiento").addEventListener("change", function () {
    const nacimiento = new Date(this.value);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    document.getElementById("edad").value = edad;
});

window.buscarCliente = async function () {
    const cedula = document.getElementById("cedula").value;
    if (!cedula) {
        alert("Por favor ingresa una cédula para buscar.");
        return;
    }
    const ref = doc(db, "clientes", cedula);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        const c = snap.data();
        llenarFormulario(c); // Usar la nueva función para llenar el formulario
        const hoy = new Date();
        const fechaVencimiento = new Date(c.fechaVencimiento);
        const estado = hoy <= fechaVencimiento
            ? "<span class='estado-activo'>Activo</span>"
            : "<span class='estado-vencido'>Vencido</span>";
        document.getElementById("resultado").innerHTML =
            `Cliente encontrado. Estado de la membresía: ${estado}`;
    } else {
        document.getElementById("resultado").innerText = "⚠️ Cliente no encontrado. Puedes registrar uno nuevo.";
        document.getElementById("registro").reset();
        document.getElementById("cedula").value = cedula;
    }
};

window.buscarClientePorApellido = async function () {
    const apellidoBusqueda = document.getElementById("apellidoBusqueda").value;
    const resultadosContainer = document.getElementById("resultadosBusquedaApellido");

    if (!apellidoBusqueda) {
        alert("Por favor ingresa un nombre o apellido para buscar.");
        resultadosContainer.innerHTML = "";
        return;
    }

    resultadosContainer.innerHTML = `<p>Buscando clientes cuyo nombre contiene: <strong>${apellidoBusqueda}</strong>...</p>`;

    try {
        const clientesSnap = await getDocs(collection(db, "clientes"));
        let listaHTML = `<h3>Clientes encontrados cuyo nombre contiene: ${apellidoBusqueda}</h3><ul>`;

        clientesSnap.forEach((docu) => {
            const data = docu.data();
            if (data.nombre && data.nombre.toLowerCase().includes(apellidoBusqueda.toLowerCase())) {
                listaHTML += `<li style="cursor: pointer;" data-cedula="${docu.id}"><strong>${data.nombre}</strong> - Cédula: ${data.cedula} - Teléfono: ${data.telefono || 'No registrado'} - Vencimiento: ${data.fechaVencimiento || 'No registrada'}</li>`;
            }
        });

        listaHTML += "</ul>";
        resultadosContainer.innerHTML = listaHTML;

        const listaItems = resultadosContainer.querySelectorAll('li');
        listaItems.forEach(item => {
            item.addEventListener('click', async function () {
                const cedulaSeleccionada = this.getAttribute('data-cedula');
                if (cedulaSeleccionada) {
                    const ref = doc(db, "clientes", cedulaSeleccionada);
                    const snap = await getDoc(ref);
                    if (snap.exists()) {
                        const clienteData = snap.data();
                        llenarFormulario(clienteData);
                        document.getElementById("resultado").innerHTML = `✅ Cliente <strong>${clienteData.nombre}</strong> seleccionado.`;
                    } else {
                        document.getElementById("resultado").innerHTML = `⚠️ No se encontró información para la cédula: ${cedulaSeleccionada}.`;
                    }
                }
            });
        });

        if (listaHTML === `<h3>Clientes encontrados cuyo nombre contiene: ${apellidoBusqueda}</h3><ul></ul>`) {
            resultadosContainer.innerHTML = `<p>No se encontraron clientes cuyo nombre contenga: <strong>${apellidoBusqueda}</strong>.</p>`;
        }

    } catch (error) {
        console.error("Error al buscar por nombre o apellido: ", error);
        resultadosContainer.innerHTML = "<p class='error'>❌ Error al realizar la búsqueda.</p>";
    }
};

document.getElementById("registro").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const cedula = document.getElementById("cedula").value;
    const telefono = document.getElementById("telefono").value;
    const fechaNacimiento = document.getElementById("fechaNacimiento").value;
    const edad = parseInt(document.getElementById("edad").value);
    const sexo = document.getElementById("sexo").value;
    const plan = parseInt(document.getElementById("plan").value);
    const valorPagado = parseInt(document.getElementById("valorPagado").value);
    const fechaIngreso = new Date(document.getElementById("fechaIngreso").value);

    const fechaVencimiento = new Date(fechaIngreso);
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + plan);
    const fechaIngresoStr = fechaIngreso.toISOString().split('T')[0];
    const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0];

    try {
        // Al registrar o actualizar, resetear el estado de la notificación de vencimiento
        await setDoc(doc(db, "clientes", cedula), {
            nombre,
            cedula,
            telefono,
            fechaNacimiento,
            edad,
            sexo,
            plan,
            valorPagado,
            fechaIngreso: fechaIngresoStr,
            fechaVencimiento: fechaVencimientoStr,
            // Nuevo campo: al registrar/actualizar, no se ha enviado la notificación de "vence mañana" para este nuevo ciclo
            notificacionVencimientoMañanaEnviada: false 
        });

        const hoy = new Date();
        const estado = hoy <= fechaVencimiento
            ? "<span class='estado-activo'>Activo</span>"
            : "<span class='estado-vencido'>Vencido</span>";

        document.getElementById("resultado").innerHTML =
            `✅ Cliente <strong>${nombre}</strong> actualizado correctamente.<br>Su membresía vence el <strong>${fechaVencimientoStr}</strong>.<br>Estado: ${estado}`;

        verificarVencimientos(); // Vuelve a verificar y actualizar la lista de vencimientos

    } catch (error) {
        console.error("Error al registrar: ", error);
        document.getElementById("resultado").innerText = "❌ Error al guardar los datos.";
    }
});

// Función para actualizar el estado de notificación en Firebase
window.marcarNotificacionEnviada = async function (cedula) {
    try {
        const clienteRef = doc(db, "clientes", cedula);
        await updateDoc(clienteRef, {
            notificacionVencimientoMañanaEnviada: true
        });
        console.log(`Notificación de vencimiento marcada como enviada para: ${cedula}`);
    } catch (error) {
        console.error("Error al actualizar la notificación en Firestore: ", error);
    }
}

async function verificarVencimientos() {
    const container = document.getElementById("vencenManana");
    container.innerHTML = "";

    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    // Para asegurar que la comparación de fechas sea solo por el día, mes y año, 
    // y no por la hora, minutos, segundos, que pueden causar discrepancias.
    const fechaObjetivo = mañana.toISOString().split("T")[0];

    const clientesSnap = await getDocs(collection(db, "clientes"));
    clientesSnap.forEach((docu) => {
        const data = docu.data();
        // Compara la fecha de vencimiento del cliente con la fecha objetivo (mañana)
        // Y verifica si la notificación para "vence mañana" ya fue enviada
        if (data.fechaVencimiento === fechaObjetivo) {
            const mensaje = encodeURIComponent(`Hola ${data.nombre}, te saludamos desde el gimnasio Fuerza Delta. Tu membresía vence el ${data.fechaVencimiento}. Te esperamos para renovar y seguir entrenando💪🏻!. Éste es un mensaje automático. Muchas gracias.`);
            const link = `https://wa.me/57${data.telefono}?text=${mensaje}`;

            const div = document.createElement("div");
            let buttonHtml = '';

            // Si la notificación ya fue enviada para esta fecha de vencimiento, muestra el check
            // Asegúrate de que el campo exista y sea true
            if (data.notificacionVencimientoMañanaEnviada === true) {
                buttonHtml = '<span>✅ WhatsApp enviado</span>';
            } else {
                // Si no ha sido enviada, muestra el botón y configura el onclick
                buttonHtml = `
                    <a class='whatsapp-link' target='_blank' href='${link}' 
                       onclick="this.outerHTML='<span>✅ WhatsApp enviado</span>'; marcarNotificacionEnviada('${data.cedula}'); return true;">📲 Enviar WhatsApp</a>
                `;
            }
            
            div.innerHTML = `
                <strong>${data.nombre}</strong> (${data.telefono}) vence el ${data.fechaVencimiento}<br>
                ${buttonHtml}
                <br><br>
            `;
            container.appendChild(div);
        }
    });
}
    
// Llama a la función al cargar la página para mostrar los clientes que vencen
verificarVencimientos();

function llenarFormulario(data) {
    document.getElementById("nombre").value = data.nombre || "";
    document.getElementById("telefono").value = data.telefono || "";
    document.getElementById("fechaNacimiento").value = data.fechaNacimiento || "";
    document.getElementById("edad").value = data.edad || "";
    document.getElementById("sexo").value = data.sexo || "Masculino";
    document.getElementById("plan").value = data.plan || "1";
    document.getElementById("fechaIngreso").value = data.fechaIngreso || "";
    document.getElementById("valorPagado").value = data.valorPagado || "";
    document.getElementById("cedula").value = data.cedula || "";
}