/*******
 * Setup
 */
var injectedWeb3 = -1;

function getInfuraWeb3() {
  return new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/f2ad84c46afc46dbbcff77c065730668'));
}

// Modern dapp browsers...
if (window.ethereum) {
  window.web3 = new Web3(ethereum);
  injectedWeb3 = 1;
  console.log('injected modern web3');
}
// Legacy dapp browsers...
else if (window.web3) {
  web3 = new Web3(web3.currentProvider);
  var injectedWeb3 = 0;
  console.log('injected legacy web3');
}
// Non-dapp browsers...
else {
  web3 = getInfuraWeb3();
  console.log('read only');
}

var expiration,
  selection = [],
  drawResult = {
    result: '',
    final: false
  },
  betSize = 6,
  betValue = 2e16,
  loading = 0,
  loadingTotal = 5,
  progressBar = document.getElementsByClassName('progress-bar')[0];

document.getElementById('span-contract-address').innerText = contractAddress.substring(2);

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
    let smallIsActive = document.getElementById('small-is-active');
    expiration = new Date(_expiration.toNumber() * 1000);
    var date_str = expiration.getDate().toString().padStart(2, '0') +
      '/' + (expiration.getMonth() + 1).toString().padStart(2, '0') +
      '/' + expiration.getFullYear().toString().padStart(2, '0') +
      ' ' + expiration.getHours().toString().padStart(2, '0') +
      ':' + expiration.getMinutes().toString().padStart(2, '0');
    document.getElementById('span-bets-end').innerText = date_str;

    if (expiration > new Date()) {
      smallIsActive.innerText = 'not final';
    } else {
      smallIsActive.innerText = 'final';
      drawResult.final = true;
      enableWithdraw();
    }
  }
}

function betSizeCB(error, _betSize) {
  if (error) {
    console.error(error);
  } else {
    betSize = _betSize;

    var selection = document.getElementsByClassName('selection')[0];
    for (var i = 0; i < betSize; i++) {
      selection.innerHTML += `<b class='ball'>?</b>`;
    }

    incrementProgress();
  }
}

function getResultCB(error, result) {
  if (error) {
    console.error(error);
  } else {
    drawResult.result = result;

    var bet = document.getElementsByClassName('bet')[0];
    bet.innerHTML = '';

    var result = convertResult(result);

    for (var i in result) {
      bet.innerHTML += `<b class='ball'>${result[i]}</b>`;
    }

    incrementProgress();
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
    getResultCB(null, result.args._result);
  }
});

/******************
 * DOM Manipulation
 */
function incrementProgress() {
  loading++;

  var progress = parseInt(loading / loadingTotal * 100);
  progressBar.setAttribute('aria-valuenow', progress);
  var progressText = `${progress}%`;
  progressBar.innerHTML = progressText;
  progressBar.style.width = progressText;

  if (loading === loadingTotal) {
    setTimeout(_ => {
      document.getElementsByTagName('main')[0].style.display = 'block';
      document.getElementsByTagName('header')[0].style.display = 'none';
    }, 500);
  }
}

function resetView() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;

  let cells = document.getElementsByClassName('cell');
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].hasAttribute('data-selected')) {
      cells[i].setAttribute('data-selected', false);
      cells[i].className = 'cell';
    }
  }

  selection = [];
  setButtonState();
  setBalls();
}

function convertResult(result) {
  var numbers = [];

  for (var i = 0; i <= betSize; i++) {
    var start = i * 2;
    var int = result.substring(start, start + 2);
    if (i > 1 && int == 0) {
      break
    } else if (int == '0x') {
      continue
    } else {
      numbers.push(parseInt(int, 16));
    }
  }

  return numbers;
}

function populateBoard(maxNumber) {
  var square = Math.ceil(Math.sqrt(maxNumber));
  var number = 0;
  var numbers = document.getElementsByClassName('board')[0];
  for (var i = 0; i < square; i++) {
    numbers.innerHTML += `<div class='row row${i}'></div>`;
    for (var j = 0; j < square; j++) {
      let row = document.getElementsByClassName(`row row${i}`)[0];
      if (number < maxNumber) {
        row.innerHTML += `<div class='cell' data-number='${number}' data-selected='false'>${number}</div>`;
      } else {
        row.innerHTML += `<div class='cell'>&nbsp;</div>`;
      }

      number++;
    }
  }
};

function setBalls() {
  let balls = document.getElementsByClassName('selection')[0].children;
  for (var i = 0; i < balls.length; i++) {
    balls[i].innerText = selection[i] === undefined ? '?' : selection[i];
  }
};

function setSpanPot(prizeAvailable) {
  prizeAvailable = parseInt(prizeAvailable) / 1e18 || 0;
  document.getElementById('span-pot').innerText = 'Ξ ' + prizeAvailable;

  incrementProgress();
};

function setButtonState() {
  let buttonBet = document.getElementById('button-bet');
  if (expiration > new Date() && selection.length == betSize) {
    buttonBet.disabled = false;
  } else {
    buttonBet.disabled = true;
  }
};

function sortNumber(a, b) {
  return a - b;
};

function enableWithdraw() {
  let withdrawPanel = document.getElementById('withdraw-panel');
  withdrawPanel.querySelector('.card').title = '';
  withdrawPanel.querySelector('#text-secret').disabled = false;
  withdrawPanel.querySelector('#button-withdraw').disabled = false;

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

function getMyBetsToCurrentContract() {
  var loading = document.getElementById('div-my-bets-loading');
  loading.style.display = 'block';

  var betReceivedEvent = EtherLoto.abi.find((element) => {
    if (element.name === 'BetReceived') {
      return element;
    }
  });
  topicFilter = web3.sha3(`${betReceivedEvent.name}(${betReceivedEvent.inputs.map((el)=>{return el.type}).join(',')})`)

  filter = web3.eth.filter({
    fromBlock: createdAtBlock,
    to: contractAddress,
    from: web3.eth.defaultAccount,
    topics: [topicFilter]
  });

  filter.get(function (err, log) {
    if (err) {
      console.error(err);
    }

    if (log && log.length) {
      var hasWinningBet = false;
      var betsFooter = document.getElementById('p-my-bets-footer');
      var bets = document.getElementsByClassName('bets')[0];
      bets.innerHTML = '';

      for (var i = 0; i < log.length; i++) {
        var winnerClass = '';
        var isWinningBet = drawResult.result == log[i].topics[1];
        hasWinningBet = hasWinningBet || isWinningBet;
        var bet = document.createElement('span')
        var betNumbers = convertResult(log[i].topics[1]);

        if (isWinningBet) {
          if (drawResult.final) {
            winnerClass = 'winner';
          } else {
            winnerClass = 'almost-winner';
          }
        }

        for (var j = 0; j < betNumbers.length; j++) {
          bet.innerHTML += `<b class='ball ${winnerClass}'>${betNumbers[j]}</b>`;
        }

        bets.appendChild(bet);
      }

      if (drawResult.final) {
        if (hasWinningBet) {
          betsFooter.innerHTML = '';
          document.getElementById('button-withdraw-now').style.display = 'inline-block';
        } else {
          betsFooter.innerHTML = 'Sadly you didn\'t won this time.</br>See you at the next draw!';
        }
      } else if (hasWinningBet) {
        betsFooter.innerHTML = 'If the lottery had ended by now, you\'d be the winner!</br>Keep betting to increase your chances!';
      } else {
        betsFooter.innerHTML = 'The lottery is still running.</br>Keep betting to increase your chances!';
      }
    } else {
      bets.innerHTML = '<p>You haven\'t made any bet to this draw.<br/>You should start now!<p>';
    }

    loading.style.display = 'none';
  });
  filter.stopWatching();
}

function setEvents() {
  $('.nav-link').on('click', e => {
    var activeLink = $('.nav-link.active').get(0);
    if (e.target.hash === activeLink.hash) {
      return;
    } else if (e.target.hash === '#Bet') {
      $('.panel').hide();
      $('#bet-panel').show();
    } else if (e.target.hash === '#MyBets') {
      $('.panel').hide();
      getMyBetsToCurrentContract();
      $('#my-bets-panel').show();
    } else {
      $('.panel').hide();
      $('#withdraw-panel').show();
    }

    $(activeLink).removeClass('active');
    $(e.target).addClass('active');
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
    var bet = '0x';

    for (var i = 0; i < 25; i++) {
      if (i < betSize) {
        bet += selection[i].toString(16).padStart(2, '0');
      } else {
        bet += '00';
      }
    }

    try {
      // Request account access if needed
      if (injectedWeb3 > 0) {
        await ethereum.enable();
      }

      // Acccounts now exposed
      contractInstance.bet(bet, soliditySha3(secret), {
        from: web3.eth.defaultAccount,
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
      if (injectedWeb3 > 0) {
        await ethereum.enable();
      }

      // Acccounts now exposed
      contractInstance.withdraw(secret, {
        from: web3.eth.defaultAccount,
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