const timeout = 3000;
const periodInMinutes = 1000 * 60 * 10;

const apiUrl = "https://api.genelpara.com/embed/doviz.json";

const regex = /\$([0-9,]+\.\d{2})\s*(USD)?/;

const selectors =
  ".price:not(.u2t), .normal_price span:not(.u2t), .discount_final_price:not(.u2t), " +
  "#header_wallet_balance:not(.u2t), #search_suggestion_contents .match_subtitle:not(.u2t), " +
  ".game_purchase_price:not(.u2t), .game_area_dlc_price:not(.u2t), .your_price div:not(.u2t), " +
  ".salepreviewwidgets_StoreSalePriceBox_Wh0L8:not(.u2t), #marketWalletBalanceAmount:not(.u2t), " +
  ".market_commodity_orders_header_promote:not(.u2t), .market_commodity_orders_table td:not(.u2t)";

var interval, observer;

browser.runtime.onMessage.addListener((msg) => {
  if (!msg.update) {
    return;
  }

  update();
});

function run(data, settings) {
  var els = document.querySelectorAll(selectors);

  var hover = function (el) {
    return () =>
      (el.textContent =
        el.textContent === el.dataset.multipliedPrice
          ? el.dataset.originalPrice
          : el.dataset.multipliedPrice);
  };

  els.forEach((el) => {
    var originalContent = el.dataset.originalContent || el.textContent;

    var match = originalContent.match(regex);

    if (match) {
      var usdPrice = parseFloat(match[1]);
      var multipliedPrice = usdPrice * data.usdRate;

      var originalPrice = originalContent.replace("USD", "").trim();

      var multipliedPrice = multipliedPrice.toLocaleString("tr-TR", {
        style: "currency",
        currency: "TRY",
      });

      if (settings.currency === 2) {
        var tmpPrice = multipliedPrice;

        multipliedPrice = originalPrice;
        originalPrice = tmpPrice;
      }

      el.classList.add("u2t");

      el.dataset.originalContent = originalContent;
      el.dataset.originalPrice = originalPrice;
      el.dataset.multipliedPrice = multipliedPrice;

      if (settings.presentation === 2) {
        el.innerHTML = `${originalPrice}&nbsp;<small>(${multipliedPrice})</small>`;
      } else {
        el.textContent = `${originalPrice}`;

        if (settings.presentation === 4) {
          el.style.position = "relative";
          el.style.zIndex = "99999";

          el.onmouseover = hover(el);
          el.onmouseout = hover(el);
        }
      }
    }
  });
}

function start(update) {
  browser.storage.local.get("usdRate").then((data) => {
    if (!data.usdRate) {
      return;
    }

    browser.storage.local
      .get({
        currency: 1,
        presentation: 1,
      })
      .then((settings) => {
        if (settings.presentation === 3) {
          interval = setInterval(() => {
            var els = document.querySelectorAll("[data-multiplied-price]");

            els.forEach((el) => hover(el)());
          }, timeout);
        }

        if (update) {
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

  var els = document.querySelectorAll(".u2t");

  els.forEach((el) => {
    el.onmouseover = null;
    el.onmouseout = null;

    el.classList.remove("u2t");
  });

  start(true);
}

function init() {
  fetch(apiUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => response.json())
    .then((response) => {
      start();

      browser.storage.local.set({ usdRate: response.USD.satis }).then(() => {
        setInterval(() => update(), periodInMinutes);
      });
    });
}

init();
