window.addEventListener("load", function () {
  browser.storage.local
    .get({
      currency: 1,
      presentation: 2,
      commission: 0,
      decimals: true,
      autoClose: true
    })
    .then((result) => {
      var settings = document.forms["settings"].elements;

      settings.opCurrency.value = result.currency;
      settings.opPresentation.value = result.presentation;
      settings.opCommission.value = result.commission;
      settings.opDecimals.checked = result.decimals;
      settings.opAutoClose.checked = result.autoClose;
    });

  browser.storage.local.get("usdRate").then((data) => {
    var rate = document.getElementById("rate");

    if (data.usdRate) {
      rate.classList.remove("d-none");

      rate.textContent = (+data.usdRate).toLocaleString("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 4
      });
    }
  });
});

document.forms["settings"].addEventListener("change", async function () {
  var options = {
    currency: +this.opCurrency.value,
    presentation: +this.opPresentation.value,
    commission: +this.opCommission.value,
    decimals: this.opDecimals.checked,
    autoClose: this.opAutoClose.checked
  }

  browser.storage.local.set(options);

  const [tab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  if (tab.id) {
    browser.tabs.sendMessage(tab.id, { update: true });
  }

  if (options.autoClose) {
    self.close();
  }
});
