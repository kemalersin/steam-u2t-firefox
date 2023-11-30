window.addEventListener("load", function () {
  browser.storage.local
    .get(DEFAULT_OPTIONS)
    .then((result) => {
      var settings = document.forms["settings"].elements;

      settings.opCurrency.value = getKeyByValue(CURRENCIES, result.currency);
      settings.opPresentation.value = getKeyByValue(
        PRESENTATIONS,
        result.presentation
      );
  
      settings.opCommission.value = result.commission;
  
      settings.opDecimals.checked = result.decimals;
      settings.opAutoClose.checked = result.autoClose;
    });

  browser.storage.local.get("usdRate").then((data) => {
    var rate = document.getElementById("rate");

    if (data.usdRate) {
      rate.classList.remove("d-none");
      rate.textContent = getLocalizedPrice(+data.usdRate, 4);
    }
  });
});

document.forms["settings"].addEventListener("change", async function () {
  var options = {
    currency: CURRENCIES[this.opCurrency.value],
    presentation: PRESENTATIONS[this.opPresentation.value],

    commission: +this.opCommission.value,

    decimals: this.opDecimals.checked,
    autoClose: this.opAutoClose.checked,
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
