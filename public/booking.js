// booking.js - Lógica de reservas con cálculo de impuestos
const PRICE_PER_NIGHT = 150; // $150 por noche
// El frontend (Netlify) y el backend viven en dominios distintos.
// TODO: reemplazar por la URL real una vez desplegado el backend (Render/Railway/etc).
const PROD_API_URL = "https://REPLACE-WITH-YOUR-BACKEND-URL.onrender.com";
const API_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? `http://${window.location.hostname}:3001`
  : PROD_API_URL;

document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("booking-form");
  const bookingMessage = document.getElementById("booking-message");
  const checkinInput = document.getElementById("checkin");
  const checkoutInput = document.getElementById("checkout");
  const priceDisplay = document.getElementById("price-display");
  const confirmModal = document.getElementById("confirm-modal");
  const confirmCancelBtn = document.getElementById("confirm-cancel");
  const confirmAcceptBtn = document.getElementById("confirm-accept");

  if (!bookingForm) return;

  /**
   * Mostrar el modal de confirmación con el resumen de la reserva
   * y resolver true/false según la elección del usuario.
   */
  function showBookingConfirmation({ checkIn, checkOut, nights, pricing }) {
    document.getElementById("confirm-checkin").textContent = checkIn;
    document.getElementById("confirm-checkout").textContent = checkOut;
    document.getElementById("confirm-nights").textContent = nights;
    document.getElementById("confirm-base").textContent =
      `$${pricing.subtotal.toFixed(2)}`;
    document.getElementById("confirm-nc-tax").textContent =
      `$${pricing.nc_tax.toFixed(2)}`;
    document.getElementById("confirm-meck-tax").textContent =
      `$${pricing.mecklenburg_tax.toFixed(2)}`;
    document.getElementById("confirm-occupancy").textContent =
      `$${pricing.occupancy_tax.toFixed(2)}`;
    document.getElementById("confirm-total").textContent =
      `$${pricing.total.toFixed(2)}`;

    confirmModal.classList.add("show");

    return new Promise((resolve) => {
      function cleanup(result) {
        confirmModal.classList.remove("show");
        confirmCancelBtn.removeEventListener("click", onCancel);
        confirmAcceptBtn.removeEventListener("click", onAccept);
        resolve(result);
      }
      function onCancel() {
        cleanup(false);
      }
      function onAccept() {
        cleanup(true);
      }
      confirmCancelBtn.addEventListener("click", onCancel);
      confirmAcceptBtn.addEventListener("click", onAccept);
    });
  }

  // Configurar fechas mínimas
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  checkinInput.setAttribute("min", tomorrowStr);
  checkoutInput.setAttribute("min", tomorrowStr);

  // Cargar fechas reservadas y actualizarlas cuando sea necesario
  let bookedDates = [];
  fetchBookedDates();

  // Actualizar cada 30 segundos para ver cambios en tiempo real
  setInterval(fetchBookedDates, 30000);

  // Actualizar fecha mínima del checkout cuando cambia el checkin
  checkinInput.addEventListener("change", () => {
    const checkinDate = new Date(checkinInput.value);
    if (checkinDate) {
      const minCheckout = new Date(checkinDate);
      minCheckout.setDate(minCheckout.getDate() + 1);
      checkoutInput.setAttribute(
        "min",
        minCheckout.toISOString().split("T")[0],
      );

      // Si el checkout actual es anterior al nuevo mínimo, limpiarlo
      if (checkoutInput.value && new Date(checkoutInput.value) <= checkinDate) {
        checkoutInput.value = "";
      }
    }
    updatePriceDisplay();
  });

  checkoutInput.addEventListener("change", updatePriceDisplay);

  /**
   * Cargar fechas no disponibles desde el servidor
   */
  async function fetchBookedDates() {
    try {
      const response = await fetch(`${API_URL}/api/bookings`);
      if (response.ok) {
        bookedDates = await response.json();
      }
    } catch (error) {
      console.error("Error fetching booked dates:", error);
    }
  }

  /**
   * Validar si una fecha está reservada
   */
  function isDateBooked(date) {
    const dateStr = date.toISOString().split("T")[0];
    return bookedDates.some((range) => {
      const from = new Date(range.from);
      const to = new Date(range.to);
      return date >= from && date < to;
    });
  }

  /**
   * Validar rango de fechas
   */
  function isRangeAvailable(checkIn, checkOut) {
    let current = new Date(checkIn);
    const end = new Date(checkOut);

    while (current < end) {
      if (isDateBooked(current)) {
        return false;
      }
      current.setDate(current.getDate() + 1);
    }
    return true;
  }

  /**
   * Actualizar display de precio
   */
  async function updatePriceDisplay() {
    const checkIn = checkinInput.value;
    const checkOut = checkoutInput.value;

    if (!checkIn || !checkOut) {
      if (priceDisplay) {
        priceDisplay.innerHTML = "";
      }
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      if (priceDisplay) {
        priceDisplay.innerHTML = "";
      }
      return;
    }

    const nights = Math.round(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24),
    );

    try {
      const response = await fetch(`${API_URL}/api/calculate-price`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nights: nights,
          pricePerNight: PRICE_PER_NIGHT,
        }),
      });

      if (response.ok) {
        const pricing = await response.json();

        if (priceDisplay) {
          priceDisplay.innerHTML = `
            <div class="price-breakdown">
              <div class="price-row">
                <span>Nightly rate × ${nights} nights:</span>
                <span>$${pricing.subtotal.toFixed(2)}</span>
              </div>
              <div class="price-row tax-row">
                <span>NC State Tax (${getNCRate(pricing)}%):</span>
                <span>$${pricing.nc_tax.toFixed(2)}</span>
              </div>
              <div class="price-row tax-row">
                <span>Mecklenburg Tax (${getMeckRate(pricing)}%):</span>
                <span>$${pricing.mecklenburg_tax.toFixed(2)}</span>
              </div>
              <div class="price-row tax-row">
                <span>Occupancy Tax (${getOccupancyRate(pricing)}%):</span>
                <span>$${pricing.occupancy_tax.toFixed(2)}</span>
              </div>
              <div class="price-row total-row">
                <span><strong>Total:</strong></span>
                <span><strong>$${pricing.total.toFixed(2)}</strong></span>
              </div>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error("Error calculating price:", error);
    }
  }

  /**
   * Obtener porcentaje de impuesto del desglose
   */
  function getNCRate(pricing) {
    if (pricing.subtotal === 0) return 0;
    return ((pricing.nc_tax / pricing.subtotal) * 100).toFixed(2);
  }

  function getMeckRate(pricing) {
    if (pricing.subtotal === 0) return 0;
    return ((pricing.mecklenburg_tax / pricing.subtotal) * 100).toFixed(2);
  }

  function getOccupancyRate(pricing) {
    if (pricing.subtotal === 0) return 0;
    return ((pricing.occupancy_tax / pricing.subtotal) * 100).toFixed(2);
  }

  /**
   * Manejar envío del formulario
   */
  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    bookingMessage.textContent = "";
    bookingMessage.className = "booking-message";

    const checkIn = checkinInput.value;
    const checkOut = checkoutInput.value;

    // Validaciones
    if (!checkIn || !checkOut) {
      bookingMessage.textContent =
        "Please select both check-in and check-out dates.";
      bookingMessage.className = "booking-message error";
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      bookingMessage.textContent =
        "Check-out date must be after check-in date.";
      bookingMessage.className = "booking-message error";
      return;
    }

    // Validar que el rango esté disponible
    if (!isRangeAvailable(checkIn, checkOut)) {
      bookingMessage.textContent =
        "One or more dates in this range are not available. Please select different dates.";
      bookingMessage.className = "booking-message error";
      return;
    }

    // Calcular noches
    const nights = Math.round(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24),
    );

    // Obtener precio con impuestos
    try {
      bookingMessage.textContent = "Calculating price...";
      bookingMessage.className = "booking-message";

      const priceResponse = await fetch(`${API_URL}/api/calculate-price`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nights: nights,
          pricePerNight: PRICE_PER_NIGHT,
        }),
      });

      if (!priceResponse.ok) {
        throw new Error("Failed to calculate price");
      }

      const pricing = await priceResponse.json();

      // Mostrar resumen antes de pagar
      const confirmed = await showBookingConfirmation({
        checkIn,
        checkOut,
        nights,
        pricing,
      });

      if (!confirmed) {
        bookingMessage.textContent = "";
        return;
      }

      // Mostrar estado de carga
      bookingMessage.textContent = "Preparing secure payment... Please wait.";
      bookingMessage.className = "booking-message";

      // Llamar al backend para crear sesión de Stripe
      const sessionResponse = await fetch(
        `${API_URL}/api/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            checkIn: checkIn,
            checkOut: checkOut,
            nights: nights,
            pricePerNight: PRICE_PER_NIGHT,
          }),
        },
      );

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || "Failed to create payment session");
      }

      const session = await sessionResponse.json();

      // Guardar datos temporalmente
      localStorage.setItem("pending_booking_checkIn", checkIn);
      localStorage.setItem("pending_booking_checkOut", checkOut);
      localStorage.setItem("pending_session_id", session.id);

      // Redirigir a Stripe (asumiendo que usas Stripe Checkout)
      // Para esto necesitarías cargar Stripe.js y usar redirectToCheckout
      // Por ahora redirigimos a la URL de sesión
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error("No checkout URL provided");
      }
    } catch (error) {
      console.error("Payment error:", error);
      bookingMessage.textContent = `Error: ${error.message}. Please try again or contact us.`;
      bookingMessage.className = "booking-message error";
    }
  });
});
