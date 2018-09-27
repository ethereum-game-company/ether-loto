/*******
 * Setup
 */
var injectedWeb3 = -1;

// Modern dapp browsers...
if (window.ethereum) {
  window.web3 = new Web3(ethereum);
  injectedWeb3 = 1;
  console.log("injected modern web3");
}
// Legacy dapp browsers...
else if (window.web3) {
  web3 = new Web3(web3.currentProvider);
  var injectedWeb3 = 0;
  console.log("injected legacy web3");
}
// Non-dapp browsers...
else {
  web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/f2ad84c46afc46dbbcff77c065730668"));
  console.log("read only");
}

var expiration,
  selection = [],
  betSize = 6,
  betValue = 2e16,
  loading = 0,
  loadingTotal = 5,
  progressBar = $('.progress-bar');

$('#span-contract-address').text(contractAddress.substring(2));

var etherLotoContract = web3.eth.contract(EtherLoto.abi);
var contractInstance = etherLotoContract.at(contractAddress);

console.log('Getting Expiration.');
contractInstance.expiration(expirationCB);
console.log('Getting Bet Size.');
contractInstance.betSize(betSizeCB);
console.log('Getting Result.');
contractInstance.getResult(getResultCB);
console.log('Getting Bet Value.');
contractInstance.betValue(betValueCB);
console.log('Getting Prize Available.');
contractInstance.prizeAvailable(prizeAvailableCB);
console.log('Getting Max Number.');
contractInstance.maxNumber(maxNumberCB);

/***********
 * Callbacks
 */
function expirationCB(error, _expiration) {
  if (error) {
    console.error(error);
  } else {
    expiration = new Date(_expiration * 1000);
    var date_str = expiration.getDate().toString().padStart(2, '0') +
      '/' + (expiration.getMonth() + 1).toString().padStart(2, '0') +
      '/' + expiration.getFullYear().toString().padStart(2, '0') +
      ' ' + expiration.getHours().toString().padStart(2, '0') +
      ':' + expiration.getMinutes().toString().padStart(2, '0');
    $('#span-bets-end').text(date_str);

    if (expiration > new Date()) {
      $('#small-is-active').html('not final');
    } else {
      $('#small-is-active').html('final');
      enableWithdraw();
    }
  }
}

function betSizeCB(error, _betSize) {
  if (error) {
    console.error(error);
  } else {
    betSize = _betSize;

    var selection = $('.selection');
    for (var i = 0; i < betSize; i++) {
      selection.append('<b class="ball">?</b>');
    }

    incrementProgress();
  }
}

function getResultCB(error, result) {
  if (error) {
    console.error(error);
  } else {
    convertResult(result);
  }
}

function betValueCB(error, _betValue) {
  if (error) {
    console.error(error);
  } else {
    betValue = _betValue;

    incrementProgress();
  }
}

function prizeAvailableCB(error, prizeAvailable) {
  if (error) {
    console.error(error);
  } else {
    setSpanPot(prizeAvailable);
  }
}

function maxNumberCB(error, maxNumber) {
  if (error) {
    console.error(error);
  } else {
    maxNumber = parseInt(maxNumber) + 1;

    populateBoard(maxNumber);

    setEvents();
  }
}

/********
 * Events
 */
var betReceivedEvent = contractInstance.BetReceived((error, result) => {
  if (!error) {
    setSpanPot(result.args._prizeAvailable.toNumber());
    convertResult(result.args._result);
  }
});

/******************
 * DOM Manipulation
 */
function incrementProgress() {
  loading++;

  var progress = parseInt(loading / loadingTotal * 100);
  progressBar.attr('aria-valuenow', progress);
  var progressText = `${progress}%`;
  progressBar.html(progressText);
  progressBar.css('width', progressText);

  if (loading === loadingTotal) {
    setTimeout(_ => {
      $('main').show();
      $('header').hide();
    }, 500);
  }
}

function resetView() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;

  $('.cell').each((i, j) => {
    j = $(j);
    if (j.data('selected') !== undefined) {
      j.data('select', false);
      j.removeClass('selected');
    }
  })

  selection = [];
  setButtonState();
  setBalls();
}

function convertResult(result) {
  var bet = $('.bet');
  bet.text('');
  for (var i = 0; i <= betSize; i++) {
    var start = i * 2;
    var int = result.substring(start, start + 2);
    if (i > 1 && int == 0) {
      break
    } else if (int == '0x') {
      continue
    } else {
      bet.append(`<b class="ball">${parseInt(int, 16)}</b>`);
    }
  }

  incrementProgress();
}

function populateBoard(maxNumber) {
  var square = Math.ceil(Math.sqrt(maxNumber));
  var number = 0;
  var numbers = $('.board');
  for (var i = 0; i < square; i++) {
    numbers.append(`<div class="row row${i}"></div>`);
    for (var j = 0; j < square; j++) {
      if (number < maxNumber) {
        $(`.row.row${i}`).append(`<div class="cell" data-number="${number}" data-selected="false">${number}</div>`);
      } else {
        $(`.row.row${i}`).append(`<div class="cell">&nbsp;</div>`);
      }

      number++;
    }
  }
};

function setBalls() {
  var balls = $('b.ball', '.selection');
  for (var i = 0; i < balls.length; i++) {
    $(balls[i]).text(selection[i] === undefined ? '?' : selection[i]);
  }
};

function setSpanPot(prizeAvailable) {
  prizeAvailable = parseInt(prizeAvailable) / 1e18 || 0;
  $('#span-pot').text('Ξ ' + prizeAvailable);

  incrementProgress();
};

function setButtonState() {
  if (expiration > new Date() && selection.length == betSize) {
    $('#button-bet').prop('disabled', false);
  } else {
    $('#button-bet').prop('disabled', true);
  }
};

function sortNumber(a, b) {
  return a - b;
};

function enableWithdraw() {
  $('.card', '#withdraw-panel').attr('title', '');
  $('#text-secret', '#withdraw-panel').prop('disabled', '');
  $('#button-withdraw', '#withdraw-panel').prop('disabled', '');

  incrementProgress();
};

function toggleLoadingButton(buttonName) {
  var button = $(`#button-${buttonName}`);
  button.prop('disabled', true);
  var span = $(`#span-${buttonName}`),
    divLoading = $(`#div-${buttonName}-loading`);
  if (span.css('display') === 'none') {
    span.show();
    divLoading.hide();
    button.prop('disabled', '');
  } else {
    span.hide();
    divLoading.show();
  }
}

function setEvents() {
  $('.nav-link').on('click', e => {
    var active = $('.nav-link.active').get(0).hash;
    if (e.target.hash === active) {
      return;
    } else if (e.target.hash === '#Bet') {
      $('#withdraw-panel').hide();
      $('#bet-panel').show();
    } else {
      $('#bet-panel').hide();
      $('#withdraw-panel').show();
    }

    $('.nav-link').toggleClass('active');
  });

  $('.cell').on('click', e => {
    e = $(e.target);
    if (e.data('selected') === undefined) return;

    if (e.data('selected')) {
      for (var i = 0; i < selection.length; i++) {
        e.removeClass('selected');
        if (selection[i] === e.data('number')) {
          if (i < selection.length) {
            selection = selection.slice(0, i).concat(selection.slice(i + 1));
          } else {
            selection.pop();
          }
        }
      }
    } else if (selection.length < betSize) {
      e.addClass('selected');
      selection.push(e.data('number'));
      selection.sort(sortNumber);
    } else {
      alert('You\'ve selected all of your numbers.');
      return;
    }

    setButtonState();
    e.data('selected', !e.data('selected'));

    setBalls();
  });

  $('#button-bet').on('click', async _ => {
    toggleLoadingButton('bet');

    if (injectedWeb3 === -1) {
      alert('This is a read only version of the page;\r\nConsider installing Metamask!');
      toggleLoadingButton('bet');
      return;
    }

    var secret = $('#text-secret', '#bet-panel').val();
    var bet = "0x";

    for (var i = 0; i < 25; i++) {
      if (i < betSize) {
        bet += selection[i].toString(16).padStart(2, '0');
      } else {
        bet += "00";
      }
    }

    try {
      // Request account access if needed
      if (injectedWeb3 > 0)
        await ethereum.enable();
      // Acccounts now exposed
      contractInstance.bet(bet, soliditySha3(secret), {
        from: web3.eth.accounts[0],
        value: betValue,
        gas: 150000
      }, (error, result) => {
        if (error) {
          console.error
        } else {
          resetView();
        }
        toggleLoadingButton('bet');
      });
    } catch (error) {
      alert('You have to authorize this dapp to make bets!');
      toggleLoadingButton('bet');
    }
  });

  $('#button-withdraw').on('click', async _ => {
    toggleLoadingButton('bet');

    if (injectedWeb3 === -1) {
      alert('This is a read only version of the page;\r\nConsider installing Metamask!');
      toggleLoadingButton('bet');
      return;
    }

    var secret = $('#text-secret', '#withdraw-panel').val();
    secret = solidityPackString(secret);

    try {
      // Request account access if needed
      if (injectedWeb3 > 0)
        await ethereum.enable();
      // Acccounts now exposed
      contractInstance.withdraw(secret, {
        from: web3.eth.accounts[0],
        gas: 210000
      }, (error, result) => {
        if (error) {
          console.error(error);
        } else {
          console.log(result);
        }

        toggleLoadingButton('bet');
      });
    } catch (error) {
      alert('You have to authorize this dapp to withdraw!');
      toggleLoadingButton('bet');
    }
  })

  incrementProgress();
};