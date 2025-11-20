// js/payment-result.js
'use strict';

// === CONFIG WOMPI (mismas que en payment.js) ===
const WOMPI_ENV = 'sandbox';
const WOMPI_BASE_URL =
  WOMPI_ENV === 'sandbox'
    ? 'https://sandbox.wompi.co'
    : 'https://production.wompi.co';

const WOMPI_PUBLIC_KEY = 'pub_test_50CMTR6cEbLADRwxltn4fBGFFohdGyMG';
const CREATOR_PRICE_IN_CENTS = 1500000; // 15.000 COP

const supabaseClient = window.supabaseClient || null;
const resultBox = document.getElementById('resultBox');

function setResult(html, isOk = false) {
  if (!resultBox) return;
  resultBox.innerHTML = html;
  resultBox.classList.toggle('result-status-ok', isOk);
  resultBox.classList.toggle('result-status-error', !isOk);
}

// ================== MAIN ==================
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const txId = params.get('id');

  if (!txId) {
    setResult(
      `<h2>Pago no encontrado</h2>
       <p>No recibimos el identificador de la transacción.</p>
       <a href="payment.html">Volver al pago</a>`
    );
    return;
  }

  try {
    // 1. Consultar transacción en Wompi
    const tx = await fetchTransaction(txId);

    if (!tx) {
      setResult(
        `<h2>Error consultando tu pago</h2>
         <p>No pudimos obtener la información de la transacción.</p>
         <a href="payment.html">Volver al pago</a>`
      );
      return;
    }

    // 2. Validar estado, monto y moneda
    if (tx.status !== 'APPROVED') {
      setResult(
        `<h2>Pago no aprobado</h2>
         <p>Estado actual: <strong>${tx.status}</strong></p>
         <p>${tx.status_message || 'Sin detalle adicional.'}</p>
         <a href="payment.html">Intentar de nuevo</a>`
      );
      return;
    }

    if (tx.amount_in_cents !== CREATOR_PRICE_IN_CENTS || tx.currency !== 'COP') {
      setResult(
        `<h2>Advertencia de validación</h2>
         <p>El monto o la moneda del pago no coinciden con lo esperado.</p>
         <p>Recibimos: ${(tx.amount_in_cents / 100).toLocaleString(
           'es-CO'
         )} ${tx.currency}</p>
         <a href="index.html">Volver al inicio</a>`
      );
      return;
    }

    // 3. Intentar leer el correo del pago (si viene)
    const rawEmail =
      tx.customer_email ||
      tx.customerEmail ||
      (tx.customer && tx.customer.email) ||
      '';
    const emailPago = rawEmail ? rawEmail.toLowerCase() : null;

    const currentUser =
      JSON.parse(localStorage.getItem('legado_currentUser')) || null;

    // ================== CASO 1: NO HAY SESIÓN ==================
    if (!currentUser) {
      if (emailPago) {
        localStorage.setItem('legado_pendingPaidEmail', emailPago);
      }

      setResult(
        `<h2>Pago aprobado ✅</h2>
         <p>Tu pago fue aprobado correctamente.</p>
         ${
           emailPago
             ? `<p>Cuando inicies sesión con <strong>${emailPago}</strong>, activaremos tu perfil de creador.</p>`
             : `<p>Ahora inicia sesión con el correo que usaste en Wompi para que podamos activar tu perfil de creador.</p>`
         }
         <a href="login.html#login">Ir a iniciar sesión</a>`,
        true
      );
      return;
    }

    // ================== CASO 2: HAY SESIÓN ==================
    const userEmail = (currentUser.email || '').toLowerCase();

    // Si viene correo del pago y es distinto, solo avisamos en consola,
    // pero igualmente activamos al usuario actual (como tú querías).
    if (emailPago && userEmail && emailPago !== userEmail) {
      console.warn(
        'El correo del pago no coincide con el de la sesión.',
        'Sesion:', userEmail,
        'Pago:', emailPago
      );
      // Podrías mostrar un mensajito suave al usuario si quieres,
      // pero NO bloqueamos la activación.
    }

    // 4. Actualizar perfil en Supabase (usuario actual)
    let updateError = null;

    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('profiles')
        .update({
          has_paid: true,
          is_creator: true,
          payment_method: tx.payment_method_type || 'WOMPI_LINK',
          creator_since: new Date().toISOString(),
        })
        .eq('id', currentUser.id)
        .select()
        .single();

      updateError = error;

      if (!error && data) {
        currentUser.hasPaid = true;
        currentUser.isCreator = true;
        currentUser.paymentMethod = data.payment_method;
        currentUser.creatorSince = data.creator_since;
        localStorage.setItem('legado_currentUser', JSON.stringify(currentUser));
      }
    }

    if (updateError) {
      console.error('Error actualizando perfil:', updateError);
      setResult(
        `<h2>Pago aprobado ✅</h2>
         <p>Tu pago fue aprobado, pero tuvimos un problema guardando la activación.</p>
         <p>Por favor contáctanos con el comprobante de pago.</p>
         <a href="index.html">Volver al inicio</a>`,
        true
      );
      return;
    }

    // 5. Todo OK: mensaje y redirección al dashboard
    setResult(
      `<h2>¡Pago aprobado y cuenta activada! 🎉</h2>
       <p>Tu perfil de creador está listo.</p>
       <p>Te llevaremos a tu panel en un momento...</p>`,
      true
    );

    setTimeout(() => {
      window.location.href = 'dashboard-creator.html';
    }, 2500);
  } catch (err) {
    console.error(err);
    setResult(
      `<h2>Error inesperado</h2>
       <p>Ocurrió un problema verificando tu pago.</p>
       <a href="payment.html">Volver a intentarlo</a>`
    );
  }
});

// ================== HELPERS ==================

async function fetchTransaction(id) {
  const res = await fetch(`${WOMPI_BASE_URL}/v1/transactions/${id}`, {
    headers: {
      Authorization: `Bearer ${WOMPI_PUBLIC_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    console.error('Error HTTP consultando transacción:', res.status);
    return null;
  }

  const json = await res.json();
  return json.data || null;
}
