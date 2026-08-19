// booking.js - Lógica de reservas con flatpickr (fechas bloqueadas visualmente)
const PRICE_PER_NIGHT = 150;
const PROD_API_URL = "https://escapelakenorman-api.onrender.com";
const API_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? `http://${window.location.hostname}:3001`
  : PROD_API_URL;

document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("booking-form");
  const bookingMessage = document.getElementById("booking-message");
  const priceDisplay = document.getElementById("price-display");
  const confirmModal = document.getElementById("confirm-modal");
  const confirmCancelBtn = document.getElementById("confirm-cancel");
  const confirmAcceptBtn = document.getElementById("confirm-accept");

  if (!bookingForm) return;

  // Estado de fechas bloqueadas
  let bookedDateRanges = [];

  // Generar array de fechas individuales bloqueadas (para flatpickr disable)
  function getBlockedDates() {
    const dates = [];
    bookedDateRanges.forEach((range) => {
      let current = new Date(range.from);
      const end = new Date(range.to);
      while (current < end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    });
    return dates;
  }

  // Inicializar flatpickr para check-in (mínimo mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const checkinPicker = flatpickr("#checkin", {
    dateFormat: "Y-m-d",
    minDate: tomorrow,
    disableMobile: true,
    locale: "es",
    onChange: function (selectedDates, dateStr) {
      if (selectedDates.length > 0) {
        // Checkout mínimo = checkin + MIN_NIGHTS días
        const minCheckout = new Date(selectedDates[0]);
        minCheckout.setDate(minCheckout.getDate() + MIN_NIGHTS);
        checkoutPicker.set("minDate", minCheckout);

        // Si checkout actual es menor al nuevo mínimo, limpiarlo
        const currentCheckout = checkoutPicker.selectedDates[0];
        if (currentCheckout && currentCheckout < minCheckout) {
          checkoutPicker.clear();
        }
      }
      updatePriceDisplay();
    },
  });

  const MIN_NIGHTS = 10;

  // Inicializar flatpickr para check-out
  const checkoutPicker = flatpickr("#checkout", {
    dateFormat: "Y-m-d",
    minDate: tomorrow,
    disableMobile: true,
    locale: "es",
    onChange: function () {
      updatePriceDisplay();
    },
  });

  // Función para actualizar las fechas bloqueadas en ambos pickers
  function refreshDisabledDates() {
    const blocked = getBlockedDates();
    checkinPicker.set("disable", blocked);
    checkoutPicker.set("disable", blocked);
  }

  // Cargar fechas reservadas desde el servidor
  fetchBookedDates();

  // Actualizar cada 30 segundos
  setInterval(fetchBookedDates, 30000);

  /**
   * Cargar fechas no disponibles desde el servidor
   */
  async function fetchBookedDates() {
    try {
      const response = await fetch(`${API_URL}/api/bookings`);
      if (response.ok) {
        bookedDateRanges = await response.json();
        refreshDisabledDates();
      }
    } catch (error) {
      console.error("Error fetching booked dates:", error);
    }
  }

  /**
   * Validar si una fecha individual está reservada
   */
  function isDateBooked(date) {
    const dateStr = date.toISOString().split("T")[0];
    return bookedDateRanges.some((range) => {
      const from = new Date(range.from);
      const to = new Date(range.to);
      return date >= from && date < to;
    });
  }

  /**
   * Validar rango de fechas completo
   */
  function isRangeAvailable(checkIn, checkOut) {
    let current = new Date(checkIn);
    const end = new Date(checkOut);
    while (current < end) {
      if (isDateBooked(current)) return false;
      current.setDate(current.getDate() + 1);
    }
    return true;
  }

  /**
   * Actualizar display de precio
   */
  async function updatePriceDisplay() {
    const checkIn = checkinPicker.selectedDates[0];
    const checkOut = checkoutPicker.selectedDates[0];

    if (!checkIn || !checkOut) {
      if (priceDisplay) priceDisplay.innerHTML = "";
      return;
    }

    if (checkOut <= checkIn) {
      if (priceDisplay) priceDisplay.innerHTML = "";
      return;
    }

    const nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    try {
      const response = await fetch(`${API_URL}/api/calculate-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nights, pricePerNight: PRICE_PER_NIGHT }),
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
                <span>NC State Tax (${((pricing.nc_tax / pricing.subtotal) * 100).toFixed(2)}%):</span>
                <span>$${pricing.nc_tax.toFixed(2)}</span>
              </div>
              <div class="price-row tax-row">
                <span>Mecklenburg Tax (${((pricing.mecklenburg_tax / pricing.subtotal) * 100).toFixed(2)}%):</span>
                <span>$${pricing.mecklenburg_tax.toFixed(2)}</span>
              </div>
              <div class="price-row tax-row">
                <span>Occupancy Tax (${((pricing.occupancy_tax / pricing.subtotal) * 100).toFixed(2)}%):</span>
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
   * Mostrar modal de confirmación
   */
  function showBookingConfirmation({ checkIn, checkOut, nights, pricing }) {
    document.getElementById("confirm-checkin").textContent = checkIn;
    document.getElementById("confirm-checkout").textContent = checkOut;
    document.getElementById("confirm-nights").textContent = nights;
    document.getElementById("confirm-base").textContent = `$${pricing.subtotal.toFixed(2)}`;
    document.getElementById("confirm-nc-tax").textContent = `$${pricing.nc_tax.toFixed(2)}`;
    document.getElementById("confirm-meck-tax").textContent = `$${pricing.mecklenburg_tax.toFixed(2)}`;
    document.getElementById("confirm-occupancy").textContent = `$${pricing.occupancy_tax.toFixed(2)}`;
    document.getElementById("confirm-total").textContent = `$${pricing.total.toFixed(2)}`;

    confirmModal.classList.add("show");

    return new Promise((resolve) => {
      function cleanup(result) {
        confirmModal.classList.remove("show");
        confirmCancelBtn.removeEventListener("click", onCancel);
        confirmAcceptBtn.removeEventListener("click", onAccept);
        resolve(result);
      }
      function onCancel() { cleanup(false); }
      function onAccept() { cleanup(true); }
      confirmCancelBtn.addEventListener("click", onCancel);
      confirmAcceptBtn.addEventListener("click", onAccept);
    });
  }

  /**
   * Manejar envío del formulario
   */
  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    bookingMessage.textContent = "";
    bookingMessage.className = "booking-message";

    const checkInDate = checkinPicker.selectedDates[0];
    const checkOutDate = checkoutPicker.selectedDates[0];

    if (!checkInDate || !checkOutDate) {
      bookingMessage.textContent = "Please select both check-in and check-out dates.";
      bookingMessage.className = "booking-message error";
      return;
    }

    const checkIn = checkinPicker.formatDate(checkInDate, "Y-m-d");
    const checkOut = checkoutPicker.formatDate(checkOutDate, "Y-m-d");

    if (new Date(checkOut) <= new Date(checkIn)) {
      bookingMessage.textContent = "Check-out date must be after check-in date.";
      bookingMessage.className = "booking-message error";
      return;
    }

    // Recargar fechas antes de validar (puede haber cambios recientes)
    await fetchBookedDates();

    if (!isRangeAvailable(checkInDate, checkOutDate)) {
      bookingMessage.textContent = "One or more dates in this range are no longer available. Please select different dates.";
      bookingMessage.className = "booking-message error";
      return;
    }

    const nights = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    if (nights < MIN_NIGHTS) {
      bookingMessage.textContent = `Minimum stay is ${MIN_NIGHTS} nights. Please select a longer period.`;
      bookingMessage.className = "booking-message error";
      return;
    }

    try {
      bookingMessage.textContent = "Calculating price...";
      bookingMessage.className = "booking-message";

      const priceResponse = await fetch(`${API_URL}/api/calculate-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nights, pricePerNight: PRICE_PER_NIGHT }),
      });

      if (!priceResponse.ok) throw new Error("Failed to calculate price");
      const pricing = await priceResponse.json();

      const confirmed = await showBookingConfirmation({ checkIn, checkOut, nights, pricing });
      if (!confirmed) {
        bookingMessage.textContent = "";
        return;
      }

      bookingMessage.textContent = "Preparing secure payment... Please wait.";
      bookingMessage.className = "booking-message";

      const sessionResponse = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIn, checkOut, nights, pricePerNight: PRICE_PER_NIGHT }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || "Failed to create payment session");
      }

      const session = await sessionResponse.json();

      localStorage.setItem("pending_booking_checkIn", checkIn);
      localStorage.setItem("pending_booking_checkOut", checkOut);
      localStorage.setItem("pending_session_id", session.id);

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
