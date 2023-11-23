window.addEventListener("load", function () {
  browser.storage.local
    .get({
      currency: 1,
      presentation: 1,
    })
    .then((result) => {
      var settings = document.forms["settings"].elements;

      settings.opCurrency.value = result.currency;
      settings.opPresentation.value = result.presentation;
    });
});

document.forms["settings"].addEventListener("change", async function () {
  browser.storage.local.set({
    currency: +this.opCurrency.value,
    presentation: +this.opPresentation.value,
  });

  const [tab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  if (tab.id) {
    browser.tabs.sendMessage(tab.id, { update: true });
  }

  self.close();
});
