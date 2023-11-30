var interval, observer;

browser.runtime.onMessage.addListener((msg) => {
  if (!msg.update) {
    return;
  }

  update();
});

function run(data, settings) {
  var selectors = convertHTMLSelectors();
  var elements = document.querySelectorAll(selectors);

  elements.forEach((element) => {
    var originalContent = element.dataset.originalContent || element.textContent;

    var match = originalContent.match(PRICE_REGEX);

    if (match) {
      var usdPrice = parseFloat(match[1]);
      var multipliedPrice = usdPrice * data[STORAGE_KEYS.USD_RATE];
      var fractionDigits = (settings.decimals === DECIMALS.SHOW) ? 2 : 0;
      
      var originalPrice = originalContent.replace(CURRENCY_CODES.USD, "").trim();

      if (settings.commission !== COMMISSIONS.NONE) {
        multipliedPrice = multipliedPrice * (1 + (settings.commission / 100));
      }      

      multipliedPrice = getLocalizedPrice(multipliedPrice, fractionDigits);

      if (settings.currency === CURRENCIES.TRY) {
        var tmpPrice = multipliedPrice;

        multipliedPrice = originalPrice;
        originalPrice = tmpPrice;
      }

      element.classList.add(CUSTOM_HTML_SIGN);

      element.dataset.originalContent = originalContent;
      element.dataset.originalPrice = originalPrice;
      element.dataset.multipliedPrice = multipliedPrice;

      if (settings.presentation === PRESENTATIONS.SIDE_BY_SIDE) {
        element.innerHTML = `
          ${originalPrice}&nbsp;
          <small>(${multipliedPrice})</small>
          `;
      } else {
        element.textContent = `${originalPrice}`;

        if (settings.presentation === PRESENTATIONS.HOVER) {
          element.style.position = HOVER_STYLE.POSITION;
          element.style.zIndex = HOVER_STYLE.Z_INDEX;

          element.onmouseover = getRotationModifier(element);
          element.onmouseout = getRotationModifier(element);
        }
      }
    }
  });
}

function start(updateData) {
  browser.storage.local.get(STORAGE_KEYS.USD_RATE).then((data) => {
    if (!data.usdRate) {
      return;
    }

    browser.storage.local
      .get(DEFAULT_OPTIONS)
      .then((settings) => {
        if (settings.presentation === PRESENTATIONS.ROTATIVE) {
          interval = setInterval(() => {
            var elements = document.querySelectorAll(CUSTOM_HTML_DATA_SELECTOR);

            elements.forEach((element) => getRotationModifier(element)());
          }, ROTATION_TIMEOUT);
        }

        if (updateData) {
          run(data, settings);
        }

        observer = new MutationObserver(() => run(data, settings));

        observer.observe(document, { childList: true, subtree: true });
      });
  });
}

function update() {
  if (interval) {
    clearTimeout(interval);
  }

  if (observer) {
    observer.disconnect();
  }

  var elements = document.querySelectorAll(CUSTOM_HTML_SIGN_SELECTOR);

  elements.forEach((element) => {
    element.onmouseover = null;
    element.onmouseout = null;

    element.classList.remove(CUSTOM_HTML_SIGN);
  });

  start(true);
}

function init() {
  fetch(API_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => response.json())
    .then((response) => {
      start();

      browser.storage.local.set({ usdRate: response.USD.satis }).then(() => {
        setInterval(() => init(), PERIOD_IN_MINUTES);
      });
    });
}

init();