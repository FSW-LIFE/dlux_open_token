var steem = require('dsteem');
var steemState = require('steem-state');
var steemTransact = require('steem-transact');
var readline = require('readline');
var fs = require('fs');

const IPFS = require('ipfs-api');
var ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https'});
const args = require('minimist')(process.argv.slice(2));
const express = require('express')

// Attempts to get the hash of that state file.
const crypto = require('crypto')
const bs58 = require('bs58')
const hashFunction = Buffer.from('12', 'hex')
function hashThis(data) {
  const digest = crypto.createHash('sha256').update(data).digest()
  const digestSize = Buffer.from(digest.byteLength.toString(16), 'hex')
  const combined = Buffer.concat([hashFunction, digestSize, digest])
  const multihash = bs58.encode(combined)
  return multihash.toString()
}

// Read line for CLI access
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Cycle through good public IPFS gateways
var cycle = 0
function cycleIPFS(num){
  //ipfs = new IPFS({ host: state.gateways[num], port: 5001, protocol: 'https' });
}


var agreements
const VERSION = 'v0.0.1a'
const app = express()
const ENV = process.env;
const port = ENV.PORT || 3000;
const key = ENV.KEY || '';
const ACTIVE = ENV.ACTIVE || '';
var escrow = false
const username = ENV.ACCOUNT || 'dlux-io';
const NODEDOMAIN = ENV.DOMAIN
const BIDRATE = ENV.BIDRATE
const engineCrank = ''//'QmbdDPeMqYQ9vtdJYSm9RaM7a7Qs9dvBMRqqohtrGMdLFT'

app.get('/', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify({stats: state.stats, node: username, VERSION, realtime: isStreaming()}, null, 3))
});
app.get('/@:username', (req, res, next) => {
  let username = req.params.username
  let bal = state.balances[username] || 0
  let pb = state.pb[username] || 0
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({balance: bal, poweredUp: pb}, null, 3))
});
app.get('/stats', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({stats: state.stats, node: username, VERSION, realtime: isStreaming()}, null, 3))
});
app.get('/state', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({state: state, node: username, VERSION, realtime: isStreaming()}, null, 3))
});
app.get('force', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({stats: state, node: username, VERSION, realtime: isStreaming()}, null, 3))
});
app.get('/runners', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({stats: state.runners, node: username, VERSION, realtime: isStreaming()}, null, 3))
});
app.get('/markets', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({markets: state.markets, node: username, VERSION, realtime: isStreaming()}, null, 3))
});
app.get('/dex', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({markets: state.dex, node: username, VERSION, realtime: isStreaming()}, null, 3))
});
app.listen(port, () => console.log(`DLUX token API listening on port ${port}!\nAvailible commands:\n/@username =>Balance\n/stats\n/markets`))

var stateStoreFile = './state.json';  // You can replace this with the location you want to store the file in, I think this will work best for heroku and for testing.
const resteemAccount = 'dlux-io';
var startingBlock = 25000000;
var current, dsteem, wif
// /\ and \/ are placeholders. They will act as the genesis state if no file is found.

var round = 0
const prefix = 'dlux_test_';
const streamMode = args.mode || 'irreversible';
console.log("Streaming using mode", streamMode);
const clientURL = ENV.APIURL || 'https://api.steemit.com'
var client = new steem.Client(clientURL);
var processor;

if (ACTIVE) {
  escrow = true
  dsteem = new steem.Client('https://api.steemit.com')
  wif = steem.PrivateKey.fromLogin(username, ACTIVE, 'active')
}


var state = {
  balances: {
    ra: 0, //reward_account
    rb: 0, //reward_budget for PRs and Bounties ... falls over to content
    rc: 0, //reward_content for distribution to steem content and it's curators
    rd: 0, //reward_delegation for distribution to delegators paid ever 25.2 hours on daily block
    re: 0, //reward_earn for distribution over powered up dlux
    ri: 0, //reward_ipfs for IPFS distribution
    rr: 0, //reward_relays for relays
    rn: 0, //reward_nodes
    rm: 0, //reward_marketing
    /*
    'dlux-io': 1000000000,
    shredz7: 100000000,
    disregardfiat: 1290171349,
    eastmael: 2642016222,
    elgeko: 1541678003,
    gabbagallery: 154048506,
    cryptoandzen: 8369556042,
    markegiles: 1265289344,
    whatsup: 354120048,
    'd-pend': 115971555,
    flash07: 14835383,
    onealfa: 330684833,
    kriptonik: 3104373601,
    gabbynhice: 68813922,
    ackza: 15274875,
    pangoli: 240608640,
    fyrstikken: 2876970756,
    angelveselinov: 13871442,
    michelios: 765105426,
    masterthematrix: 300536624,
    taskmaster4450: 156782489,
    direwolf: 1457368339,
    jznsamuel: 117465501,
    'bobby.madagascar': 696447002,
    itstime: 251729602,
    igster: 134001604,
    deybacsi: 1414164,
    protegeaa: 404618025,
    gattino: 53820121,
    mannacurrency: 23483466,
    seareader1: 58685485,
    pocketrocket: 11454529,
    preparedwombat: 297184599,
    jasnusface: 228763194,
    nataboo: 228763194,
    j85063: 9932060,
    'b-s': 285971204,
    theycallmedan: 257417213,
    tkept260: 1867087764,
    runicar: 230367193,
    lanmower: 46531849,
    acidyo: 246416131,
    tarazkp: 576249052,
    juvyjabian: 471523821,
    stackin: 18253402,
    dera123: 151322740,
    rovill: 137550227
    */
  },
  pb: {

  },
  nft: {},
  chrono: [],
  pending: [],
  escrow: [],
  bannedNodes: [],
  agents: [],
  expired: [
    'permlinks',
    'permlinks'
  ],

  contracts: {},
  posts: [],
  delegations: [],
  ico: [],
  stats: {
    hashLastIBlock: '',
    lastBlock: 0,
    tokenSupply: 100000000000,
    interestRate: 2100000,
    nodeRate: 1000,
    IPFSRate: 2000,
    relayRate: 1000,
    budgetRate: 2000,
    maxBudget: 1000000000,
    savingsRate: 1000,
    marketingRate: 1000,
    resteemReward: 10000,
    delegationRate: 1000,
    currationRate: 2500,
    exchangeRate: {
      steemDlux: '',
      btcDlux: '',
      ethDlux: '',
      usdDlux: ''
    }
  },
  dex: {
    steem: {
      tick: '',
      buyOrders: [],
      sellOrders: []
    },
    sbd: {
      tick: '',
      buyOrders: [],
      sellOrders: []
    },
    eth: {
      tick: '',
      buyOrders: [],
      sellOrders: []
    },
    btc: {
      tick: '',
      buyOrders: [],
      sellOrders: []
    }
  },
  runners: {
    'dlux-io': {
      self: 'dlux-io',
      domain: 'https://dlux-token.herokuapp.com'
    },
    'disregardfiat': {
      self: 'disregardfiat',
      domain: 'https://dlux-token-peer.herokuapp.com'
    }
  },
  markets: {
    node: {
      'dlux-io': {
        self: 'dlux-io',
        domain: 'https://dlux-token.herokuapp.com',
        bidRate: 2000,
        marketingRate: 2000,
        attempts: 10000,
        yays: 10000,
        wins: 10000,
        lastGood: 0,
        escrows: 0,
        transfers: 0,
        pending: 0,
        failed: 0,
        report: {
          agreements:{
            'dlux-io': {
              node:	"dlux-io",
              agreement:	true
            },
            disregardfiat: {
              node:	"disregardfiat",
              agreement:	true
            },
            markegiles:	{
              node:	"markegiles",
              agreement: true
            },
            shredz7:	{
              node:	"shredz7",
              agreement: true
            },
            caramaeplays: {
              node:	"caramaeplays",
              agreement: true
            },
          },
          hash: "QmTfmV2qQbvH7k26JmdBFBiqATfL8PL1vQJiVaojc8TLjV",
          block:	28611600
          }
      },
      'disregardfiat': {
        self: 'disregardfiat',
        domain: 'https://dlux-token-peer.herokuapp.com',
        bidRate: 2000,
        attempts: 10000,
        yays: 10000,
        wins: 10000,
        lastGood: 0,
        escrows: 0,
        transfers: 0,
        pending: 0,
        failed: 0,
        report: {
          agreements:{
            'dlux-io': {
              node:	"dlux-io",
              agreement:	true
            },
            disregardfiat: {
              node:	"disregardfiat",
              agreement:	true
            },
            markegiles:	{
              node:	"markegiles",
              agreement: true
            },
            shredz7:	{
              node:	"shredz7",
              agreement: true
            },
            caramaeplays: {
              node:	"caramaeplays",
              agreement: true
            },
          },
          hash: "QmTfmV2qQbvH7k26JmdBFBiqATfL8PL1vQJiVaojc8TLjV",
          block:	28611600
          }
        },
      'markegiles': {
        self: 'markegiles',
        domain: 'https://dlux-token-markegiles.herokuapp.com',
        bidRate: 2000,
        attempts: 10000,
        yays: 10000,
        wins: 10000,
        lastGood: 0,
        escrows: 0,
        transfers: 0,
        pending: 0,
        failed: 0,
        report: {
          agreements:{
            'dlux-io': {
              node:	"dlux-io",
              agreement:	true
            },
            disregardfiat: {
              node:	"disregardfiat",
              agreement:	true
            },
            markegiles:	{
              node:	"markegiles",
              agreement: true
            },
            shredz7:	{
              node:	"shredz7",
              agreement: true
            },
            caramaeplays: {
              node:	"caramaeplays",
              agreement: true
            },
          },
          hash:	"QmTfmV2qQbvH7k26JmdBFBiqATfL8PL1vQJiVaojc8TLjV",
          block:	28611600
        }
      },
        'shredz7': {
          self: 'shredz7',
          domain: 'https://dlux-token-node.herokuapp.com',
          bidRate: 2000,
          attempts: 10000,
          yays: 10000,
          wins: 10000,
          lastGood: 0,
          escrows: 0,
          transfers: 0,
          pending: 0,
          failed: 0,
          report: {
            agreements:{
              'dlux-io': {
                node:	"dlux-io",
                agreement:	true
              },
              disregardfiat: {
                node:	"disregardfiat",
                agreement:	true
              },
              markegiles:	{
                node:	"markegiles",
                agreement: true
              },
              shredz7:	{
                node:	"shredz7",
                agreement: true
              },
              caramaeplays: {
                node:	"caramaeplays",
                agreement: true
              },
            },
            hash:	"QmTfmV2qQbvH7k26JmdBFBiqATfL8PL1vQJiVaojc8TLjV",
            block:	28611600
            }
          },
          'caramaeplays': {
            self: 'caramaeplays',
            domain: 'https://dlux-token-caramaeplays.herokuapp.com',
            bidRate: 2000,
            attempts: 10000,
            yays: 10000,
            wins: 10000,
            lastGood: 0,
            escrows: 0,
            transfers: 0,
            pending: 0,
            failed: 0,
            report: {
              agreements:{
                'dlux-io': {
                  node:	"dlux-io",
                  agreement:	true
                },
                disregardfiat: {
                  node:	"disregardfiat",
                  agreement:	true
                },
                markegiles:	{
                  node:	"markegiles",
                  agreement: true
                },
                shredz7:	{
                  node:	"shredz7",
                  agreement: true
                },
                caramaeplays: {
                  node:	"caramaeplays",
                  agreement: true
                },
              },
              hash:	"QmTfmV2qQbvH7k26JmdBFBiqATfL8PL1vQJiVaojc8TLjV",
              block:	28611600
              }
            }
  },
    ipfs: {
      'dlux-io': {
        self: 'dlux-io',
        domain: 'ipfs.infura.io',
        bidRate: 20000,
        report: {}
      }
    },
    relay: {
      'dlux-io': {
        self: 'dlux-io',
        domain: 'https://chat.dlux.io',
        bidRate: 10000,
        report: {}
      }
    },
    contributors: {
      'disregardfiat': {
        self: 'disregardfiat',
        bidRate: 1,
        report: {}
      },
      'markegiles': {
        self: 'markegiles',
        bidRate: 1,
        report: {}
      }
    }
  }
}

var dappStates = {}
var plasma = {}

var transactor = steemTransact(client, steem, prefix);
if (engineCrank){
console.log(`Attempting to start from IPFS save state ${engineCrank}`);
  ipfs.cat(engineCrank, (err, file) => {
    if (!err){
      var data = JSON.parse(file);
      startingBlock = data[0]
      state = data[1];
      startApp();
    } else {
      startApp();
      console.log(`${engineCrank} failed to load, Replaying from genesis.\nYou may want to set the env var STARTHASH\nFind it at any token API such as token.dlux.io`)
    }
  });
} else {
  console.log(`Replaying from ${startingBlock}`)
  startApp();
}

/*
if(fs.existsSync(stateStoreFile)) {
  var data = fs.readFileSync(stateStoreFile, 'utf8');
  var json = JSON.parse(data);
  startingBlock = json[0];
  state = json[1];
  startApp();
} else {
  console.log('No state store file found. Starting from the genesis block+state');
  startApp();
}
*/



function startApp() {
  processor = steemState(client, steem, startingBlock, 10, prefix, streamMode);


  processor.on('send', function(json, from) {
    if(json.to && typeof json.to === 'string' && typeof json.amount === 'number' && (json.amount | 0) === json.amount && json.amount >= 0 && state.balances[from] && state.balances[from] >= json.amount) {

      if(state.balances[json.to] === undefined) {
        state.balances[json.to] = 0;
      }

      state.balances[json.to] += json.amount;
      state.balances[from] -= json.amount;
      console.log('Send occurred from', from, 'to', json.to, 'of', json.amount, 'tokens.')
    } else {
      console.log('Invalid send operation from', from)
    }
  });

  processor.on('create_nft', function(json, from) {
    if(json.nft){
      if(!state.nft[from]){
        state.nft[from] = [['DLUX' + hashThis(from+current+JSON.stringify(json.nft)),json.nft]]
      } else if (state.nft){
        state.nft[from].push(['DLUX' + hashThis(from+current),json.nft])
      }
      console.log(`${from} created an NFT`)
    } else {
      console.log(`${from} sent a spurious NFT tx`)
    }
  });

  processor.on('send_nft', function(json, from) {
    var s = 0
    if(json.to && typeof json.to === 'string'){
      if(state.nft[from]){
        for (var i = 0;i<state.nft[from].length;i++){
          if (state.nft[from][i][0]==json.nftid){
            if(state.nft[json.to]){
              state.nft[json.to].push(state.nft[from][i])
            } else {
              state.nft[json.to] = [state.nft[from][i]]
            }
            state.nft[from].splice(i,1)
            s = 1
            console.log(`${from} sent an NFT to ${json.to}`)
            break;
          }
        }
      }
    }
    if(!s){
      console.log(`${from} tried to send an NFT that wasn't theirs`)
    }
  });

  processor.on('delete_nft', function(json, from) {
    var e = 1
    if(json.nftid && typeof json.nftid === 'string' && state.nft[from]){
        for (var i = 0;i<state.nft[from].length;i++){
          if (state.nft[from][i][0]==json.nftid){
            state.nft[from].splice(i,1)
            console.log(`${from} deleted an NFT`)
            e=0
            break;
          }
        }
    }
    if (e){console.log(`${from} tried to delete an NFT that wasn't theirs`)}
  });

  processor.on('dex_sell', function(json, from) {
    if(json.contract){
      if (state.balances[from] >= state.contracts[json.to][json.contract].amount){
        console.log(`${from} sold ${state.contracts[json.to][json.contract].amount} DLUX`)
        state.balances[from] -= state.contracts[json.to][json.contract].amount
        state.balances[state.contracts[json.to][json.contract].from] += state.contracts[json.to][json.contract].amount
        state.escrow.push(state.contracts[json.to][json.contract].auths[0])
        state.escrow.push(state.contracts[json.to][json.contract].auths[1])
        if (state.contracts[json.to][json.contract].steem) {
          state.escrow.push([state.contracts[json.to][json.contract].auths[0][1][1].to,
            [
              "transfer",
              {
                "from": state.contracts[json.to][json.contract].auths[0][1][1].to,
                "to": from,
                "amount": {
                  "amount": state.contracts[json.to][json.contract].steem,
                  "precision": 3,
                  "nai": "@@000000021"
                },
                "memo": `${json.contract} fulfilled with ${state.contracts[json.to][json.contract].amount} DLUX`
              }
            ]])} else {
              state.escrow.push([state.contracts[json.to][json.contract].auths[0][1][1].to,
                [
                  "transfer",
                  {
                    "from": state.contracts[json.to][json.contract].auths[0][1][1].to,
                    "to": from,
                    "amount": {
                      "amount": state.contracts[json.to][json.contract].sbd,
                      "precision": 3,
                      "nai": "@@000000013"
                    },
                    "memo": `${json.contract} fulfilled with ${state.contracts[json.to][json.contract].amount} DLUX`
                  }
                ]])
            }
        if(state.contracts[json.to][json.contract].sbd){
          for (var i = 0;i < state.dex.sbd.buyOrders.length;i++){
            if (state.dex.sbd.buyOrders[i].txid == json.contract){
              state.dex.sbd.buyOrders.splice(i,1);break;
            }
          }
          delete state.contracts[json.to][json.contract]
        } else {
          for (var i = 0;i < state.dex.steem.buyOrders.length;i++){
            if (state.dex.steem.buyOrders[i].txid == json.contract){
              state.dex.steem.buyOrders.splice(i,1);break;
            }
          }
          delete state.contracts[json.to][json.contract]
        }
      }
    }
  });

  processor.on('dex_steem_sell', function(json, from) {
    var buyAmount = parseInt(parseFloat(json.steem) * 1000)
    if (json.dlux >= state.balances[from]){
      var txid = 'DLUX' + hashThis(from + current)
      state.dex.steem.sellOrders.push({txid, from: from, steem: buyAmount, sbd: 0, amount: json.dlux, rate:parseInt((json.dlux)*10000/(buyAmount)), block:current, partial: json.partial || true})
      state.balances[from] -= json.dlux
      if(state.contracts[from]) {
        state.contracts[from][txid] = state.dex.steem.sellOrders[state.dex.steem.sellOrders.length -1]
      } else {
        state.contracts[from] = {[txid]:state.dex.steem.sellOrders[state.dex.steem.sellOrders.length -1]}
      }
      sortSellArray (state.dex.steem.sellOrders, 'rate')
      console.log(`@${from} has placed an order to sell ${json.dlux} for ${json.steem} STEEM`)
    }
  });

  processor.on('dex_sbd_sell', function(json, from) {
    var buyAmount = parseInt(parseFloat(json.sbd) * 1000)
    if (json.dlux >= state.balances[from]){
      var txid = 'DLUX' + hashThis(from + current)
      state.dex.sbd.sellOrders.push({txid, from: from, steem: 0, sbd: buyAmount, amount: json.dlux, rate:parseInt((json.dlux)*10000/(buyAmount)), block:current, partial: json.partial || true})
      state.balances[from] -= json.dlux
      if(state.contracts[from]) {
        state.contracts[from][txid] = state.dex.sbd.sellOrders[state.dex.sbd.sellOrders.length -1]
      } else {
        state.contracts[from] = {[txid]:state.dex.sbd.sellOrders[state.dex.sbd.sellOrders.length -1]}
      }
      sortSellArray (state.dex.sbd.sellOrders, 'rate')
      console.log(`@${from} has placed an order to sell ${json.dlux} for ${json.sbd} SBD`)
    }
  });

  processor.on('dex_clear_buys', function(json, from) {
    var l = 0, t = 0
    for (var i = 0; i < state.dex.steem.buyOrders.length; i++) {
      if (state.dex.steem.buyOrders[i].from == from) {
        state.pending.push(state.dex.steem.buyOrders[i].reject)
        delete state.contracts[from][state.dex.steem.sellOrders[i].txid]
        state.dex.steem.buyOrders.splice(i,1)
      }
    }
    for (var i = 0; i < state.dex.sbd.sellOrders.length; i++) {
      if (state.dex.sbd.buyOrders[i].from == from) {
        state.pending.push(state.dex.sbd.buyOrders[i].reject)
        delete state.contracts[from][state.dex.sbd.sellOrders[i].txid]
        state.dex.sbd.buyOrders.splice(i,1)
      }
    }
    console.log(`${from} has canceled ${i} orders and recouped ${t} DLUX`)
  });

  processor.on('dex_clear_sells', function(json, from) {
    var l = 0, t = 0
    for (var i = 0; i < state.dex.steem.sellOrders.length; i++) {
      if (state.dex.steem.sellOrders[i].from == from) {
        state.balances[from] += state.dex.steem.sellOrders[i].amount
        delete state.contracts[from][state.dex.steem.sellOrders[i].txid]
        t += state.dex.steem.sellOrders[i].amount
        state.dex.steem.sellOrders.splice(i,1)
        i++
      }
    }
    for (var i = 0; i < state.dex.sbd.sellOrders.length; i++) {
      if (state.dex.sbd.sellOrders[i].from == from) {
        state.balances[from] += state.dex.sbd.sellOrders[i].amount
        delete state.contracts[from][state.dex.sbd.sellOrders[i].txid]
        t += state.dex.sbd.sellOrders[i].amount
        state.dex.sbd.sellOrders.splice(i,1)
        i++
      }
    }
    console.log(`${from} has canceled ${i} orders and recouped ${t} DLUX`)
  });

  processor.onOperation('escrow_transfer', function(json,from){//grab posts to reward
    var op, dextx, contract, isAgent
    try {
      dextx = json.json_meta.dlux_dex
      contract = state.contracts[json.to][dextx.contract]
      isAgent = state.markets.node[json.agent].report.escrow
      isDAgent = state.markets.node[json.to].report.escrow
    } catch {
      return;
    }
    if (isAgent && isDAgent && dextx){//two escrow agents to fascilitate open ended transfer with out estblishing steem/sbd bank //expiration times??
      var txid = 'DLUX' + hashThis(from + current)
      var auths = [[json.agent,
        [
          "escrow_approve",
          {
            "from": json.from,
            "to": json.to,
            "agent": json.agent,
            "who": json.agent,
            "escrow_id": json.escrow_id,
            "approve": true
        }
      ]],[json.to,
        [
          "escrow_approve",
          {
            "from": json.from,
            "to": json.to,
            "agent": json.agent,
            "who": json.to,
            "escrow_id": json.escrow_id,
            "approve": true
        }
      ]]]
      var reject =[json.to,
        [
          "escrow_release",
          {
            "from": json.from,
            "to": json.to,
            "agent": json.agent,
            "who": json.to,
            "receiver": json.from,
            "escrow_id": json.escrow_id,
            "sbd_amount": json.sbd_amount,
            "steem_amount": json.steem_amount
          }
        ]]
      if(json.steem_amount && dextx.dlux && typeof dextx.dlux === 'number') {
        console.log(`@${json.from} signed a ${json.steem_amount.amount} STEEM buy order`)
        state.dex.steem.buyOrders.push({txid, from: json.from, steem: json.steem_amount.amount, sbd: 0, amount: dextx.dlux , rate:parseInt((dextx.dlux)*10000/json.steem_amount.amount), block:current, escrow_id:json.escrow_id, agent:json.agent, fee:json.fee.amount, partial:false, auths, reject})
        if (state.contracts[json.from]){
          state.contracts[json.from][txid] = {txid, from: json.from, steem: json.steem_amount.amount, sbd: 0, amount: dextx.dlux , rate:parseInt((dextx.dlux)*10000/json.steem_amount.amount), block:current, escrow_id:json.escrow_id, agent:json.agent, fee:json.fee.amount, partial:false, auths, reject}
        } else {
          state.contracts[json.from] = {txid, from: json.from, steem: json.steem_amount.amount, sbd: 0, amount: dextx.dlux , rate:parseInt((dextx.dlux)*10000/json.steem_amount.amount), block:current, escrow_id:json.escrow_id, agent:json.agent, fee:json.fee.amount, partial:false, auths, reject}
        }
      } else if (json.sbd_amount && dextx.dlux && typeof dextx.dlux === 'number'){
        console.log(`@${json.from} signed a ${json.sbd_amount.amount} SBD buy order`)
        state.dex.sbd.buyOrders.push({txid, from: json.from, steem: 0, sbd: json.sbd_amount.amount, amount: dextx.dlux , rate:parseInt((dextx.dlux)*10000/json.sbd_amount.amount), block:current, escrow_id:json.escrow_id, agent:json.agent, fee:json.fee.amount, partial:false, auths, reject})
        if (state.contracts[json.from]){
          state.contracts[json.from][txid] = {txid, from: json.from, steem: 0, sbd: json.sbd_amount.amount, amount: dextx.dlux , rate:parseInt((dextx.dlux)*10000/json.sbd_amount.amount), block:current, escrow_id:json.escrow_id, agent:json.agent, fee:json.fee.amount, partial:false, auths, reject}
        } else {
          state.contracts[json.from] = {txid:{txid, from: json.from, steem: 0, sbd: json.sbd_amount.amount, amount: dextx.dlux , rate:parseInt((dextx.dlux)*10000/json.sbd_amount.amount), block:current, escrow_id:json.escrow_id, agent:json.agent, fee:json.fee.amount, partial:false, auths, reject}
        }
      }
    }
    if (contract && isAgent){//{txid, from: from, buying: buyAmount, amount: json.dlux, [json.dlux]:buyAmount, rate:parseFloat((json.dlux)/(buyAmount)).toFixed(6), block:current, partial: json.partial || true
      if (contract.steem == json.steem_amount.amount  && contract.sbd == json.sbd_amount.amount){
        state.balances[json.from] += contract.amount
        if (contract.steem){
          for (var i = 0; i < state.dex.steem.sellOrders.length; i++) {
            if (state.dex.steem.sellOrders[i].txid == contract.txid) {
              state.dex.steem.tick = contract.rate
              state.dex.steem.sellOrders.splice(i,1)
              break;
            }
          }
        } else {
          for (var i = 0; i < state.dex.sbd.sellOrders.length; i++) {
            if (state.dex.sbd.sellOrders[i].txid == contract.txid) {
              state.dex.sbd.tick = contract.rate
              state.dex.sbd.sellOrders.splice(i,1)
              break;
            }
          }
        }
        delete state.contracts[json.to][dextx.contract]
        state.escrow.push([json.agent,
          [
            "escrow_approve",
            {
              "from": json.from,
              "to": json.to,
              "agent": json.agent,
              "who": json.agent,
              "escrow_id": json.escrow_id,
              "approve": true
          }
        ]])

      } else if (contract.partial) {
        if (contract.steem) {
          if (contract.steem > json.steem_amount.amount) {
            const dif = contract.steem - json.steem_amount.amount
            const ratio = parseInt((json.steem_amount.amount / contract.steem) * 10000)
            const dluxFilled = parseInt((json.steem_amount.amount / contract.steem) * contract.amount)
            state.balances[json.from] += dluxFilled
            const txid = 'DLUX' + hashThis(contract.from + json.escrow_id)
            state.dex.steem.tick = contract.rate
            state.dex.steem.sellOrders.push({txid, from: contract.from, steem: dif, sbd: 0, amount: contract.amount - dluxFilled, rate:contract.rate, block:current, partial: true})
            delete state.contracts[json.to][dextx.contract]
            state.contracts[json.to][txid] = state.dex.steem.sellOrders[state.dex.steem.sellOrders.length - 1]
            sortSellArray (state.dex.steem.sellOrders, 'rate')
            state.escrow.push([json.agent,
              [
                "escrow_approve",
                {
                  "from": json.from,
                  "to": json.to,
                  "agent": json.agent,
                  "who": json.agent,
                  "escrow_id": json.escrow_id,
                  "approve": true
              }
            ]])
          }
        } else if (contract.sbd) {
          if (contract.sbd > json.sbd_amount.amount) {
            const dif = contract.sbd - json.sbd_amount.amount
            const ratio = parseInt((json.sbd_amount.amount / contract.sbd) * 10000)
            const dluxFilled = parseInt((json.sbd_amount.amount / contract.sbd) * contract.amount)
            state.balances[json.from] += dluxFilled
            const txid = 'DLUX' + hashThis(contract.from + json.escrow_id)
            state.dex.sbd.tick = contract.rate
            state.dex.sbd.sellOrders.push({txid, from: contract.from, steem: 0, sbd: dif, amount: contract.amount - dluxFilled, rate:contract.rate, block:current, partial: true})
            delete state.contracts[json.to][dextx.contract]
            state.contracts[json.to][txid] = state.dex.sbd.sellOrders[state.dex.sbd.sellOrders.length - 1]
            sortSellArray (state.dex.sbd.sellOrders, 'rate')
            state.escrow.push([json.agent,
              [
                "escrow_approve",
                {
                  "from": json.from,
                  "to": json.to,
                  "agent": json.agent,
                  "who": json.agent,
                  "escrow_id": json.escrow_id,
                  "approve": true
              }
            ]])
          }
        }
      }
    } else if (isAgent){
      state.escrow.push([json.agent,
        [
          "escrow_approve",
          {
            "from": json.from,
            "to": json.to,
            "agent": json.agent,
            "who": json.agent,
            "escrow_id": json.escrow_id,
            "approve": false
        }
      ]])
    }
  }
});

  processor.onOperation('escrow_approve', function(json) {
    var found = 0
    for (var i = 0; i < state.escrow.length; i++) {
      if (state.escrow[i][0] == json.agent && state.escrow[i][1][1].escrow_id == json.escrow_id){
        state.escrow.splice(i,1)
        found = 1
        state.pending.push([json.to,
          [
            "escrow_approve",
            {
              "from": json.from,
              "to": json.to,
              "agent": json.agent,
              "who": json.to,
              "escrow_id": json.escrow_id,
              "approve": true
          }
        ]],current)
        break;
      }
    }
    if (!found){
      for (var i = 0; i < state.pending.length; i++) {
        if (state.pending[i][0] == json.to && state.pending[i][1][1].escrow_id == json.escrow_id){
          state.pending.splice(i,1)
          break;
        }
      }
    }
  });

  processor.onOperation('escrow_release', function(json) {
    var found = 0
    for (var i = 0; i < state.escrow.length; i++) {
      if (state.escrow[i][0] == json.agent && state.escrow[i][1][1].escrow_id == json.escrow_id){
        state.escrow.splice(i,1)
        found = 1
        break;
      }
    }
    if (!found){
      for (var i = 0; i < state.pending.length; i++) {
        if (state.pending[i][0] == json.to && state.pending[i][1][1].escrow_id == json.escrow_id){
          state.pending.splice(i,1)
          break;
        }
      }
    }
  });


  processor.on('node_add', function(json, from) {
    if(json.domain && typeof json.domain === 'string') {
      var int = parseInt(json.bidRate)
      if (int < 1) {int = 1000}
      if (int > 1000) {int = 1000}
      var t = parseInt(json.marketingRate)
      if (t < 1) {int = 2000}
      if (t > 2000) {int = 2000}
      if (state.markets.node[from]){
        state.markets.node[from].domain = json.domain
        state.markets.node[from].bidRate = int
      } else {
        state.markets.node[from] = {
          domain: json.domain,
          self: from,
          bidRate: int,
          marketingRate: t,
          attempts: 0,
          yays: 0,
          wins: 0,
          lastGood: 0,
          escrows: 0,
          transfers: 0,
          pending: 0,
          failed: 0,
          report: {}
        }
      }
      console.log(`@${from} has bid the steem-state node ${json.domain} at ${json.bidRate}`)
    } else {
      console.log('Invalid steem-state node operation from', from)
    }
  });

  processor.on('node_delete', function(json, from) {
    delete state.markets.node[from].domain
    delete state.markets.node[from].bidRate
    console.log(`@${from} has deleted their steem-state node`)
  });

  processor.on('ipfs_add', function(json, from) {
    if(json.domain && typeof json.domain === 'string') {
      var int = parseInt(json.bidRate)
      if (int < 1) {int = 2000}
      if (int > 2000) {int = 2000}
      state.markets.ipfs[from] = {
        domain: json.domain,
        self: from,
        bidRate: int
      }
      console.log(`@${from} has bid the ipfs node ${json.domain} at ${json.bidRate}`)
    } else {
      console.log('Invalid ipfs node operation from', from)
    }
  });

  processor.on('ipfs_delete', function(json, from) {
    delete state.markets.ipfs[from].domain
    delete state.markets.ipfs[from].bidRate
    console.log(`@${from} has deleted their ipfs node`)
  });

  processor.on('relay_add', function(json, from) {
    if(json.domain && typeof json.domain === 'string') {
      var int = parseInt(json.bidRate)
      if (int < 1) {int = 1000}
      if (int > 1000) {int = 1000}
      state.markets.relay[from] = {
        domain: json.domain,
        self: from,
        bidRate: int
      }
      console.log(`@${from} has bid the relay ${json.domain} at ${json.bidRate}`)
    } else {
      console.log('Invalid relay operation from', from)
    }
  });

  processor.on('relay_delete', function(json, from) {
    delete state.markets.relay[from].domain
    delete state.markets.relay[from].bidRate
    console.log(`@${from} has deleted their relay`)
  });

  processor.on('set_delegation_reward', function(json, from) {
    if (from == 'dlux-io' && typeof json.rate === 'number' && json.rate < 2001 && json.rate >= 0) {
      state.stats.delegationRate = json.rate
    }
    console.log(`@dlux-io has updated their delegation reward rate`)
  });

  processor.on('set_resteem_reward', function(json, from) {
    if (from == 'dlux-io' && typeof json.reward === 'number' && json.reward < 10000 && json.reward >= 0) {
      state.stats.resteemRewad = json.reward
    }
    console.log(`@dlux-io has updated their delegation reward rate`)
  });

  processor.on('expire_post', function(json, from) {
    if (from == 'dlux-io' && typeof json.permlink === 'string') {
      state.expired.push(json.permlink)
    }
    console.log(`@dlux-io has expired rewards on ${json.permlink}`)
  });

  processor.on('report', function(json, from) {
    var cfrom, domain
    try {
      cfrom = state.markets.node[from].self
      domain = state.markets.node[from].domain
    }
    catch (err) {
    }
    if (from === cfrom && domain) {
      state.markets.node[from].report = json
      console.log(`@${from}'s report has been processed`)
    } else {
      if (from === username && NODEDOMAIN && BIDRATE) {
        console.log(`This node posted a spurious report and in now attempting to register`)
        transactor.json(username, key, 'node_add', {
          domain: NODEDOMAIN,
          bidRate: BIDRATE
        }, function(err, result) {
          if(err) {
            console.error(err);
          }
        })
      } else if (from === username) {
        console.log(`This node has posted a spurious report\nPlease configure your DOAMAIN and BIDRATE env variables`)
      } else {
      console.log(`@${from} has posted a spurious report`)
    }
    }
  });
/*
  processor.onNoPrefix('follow', function(json, from) {  // Follow id includes both follow and resteem.
    if(json[0] === 'reblog') {
      if(json[1].author === resteemAccount && state.balances[from] !== undefined && state.balances[from] > 0) {
        var valid = 1
        for (var i = 0; i < state.expired.length;i++){
          if(json.permlink == state.expired[i]){valid=0;break;}
        }
        if(valid && state.balances.rm > state.stats.resteemReward){
          state.balances[from] += state.stats.resteemReward;
          state.balances.rm -= state.stats.resteemReward;
          console.log('Resteem reward of', state.stats.resteemReward,'given to', from);
        }
      }
    }
  });
*/
  processor.onOperation('comment_options', function(json,from){//grab posts to reward
    try{
      var filter = json.extensions[0][1].beneficiaries
    } catch {
      return;
    }
    for (var i = 0; i < filter.length; i++) {
      if (filter[i].account == 'dlux-io' && filter[i].weight > 999){
        state.posts.push({[json.author]: json.permlink})
        console.log(`Added ${json.author}/${json.permlink} to dlux rewardable content`)
        break;
      }
    }
  });

  processor.onOperation('transfer', function(json){//ICO calculate
    if(json.memo.substr(0,5) == 'DLUXQm') {
      var txid = json.memo.split(' ')[0]
      for (var i = 0;i < state.escrow.length;i++){
        if(state.escrow[i][1][1].memo.split(' ') == txid && state.escrow[i][0] == json.from){
          state.escrow.splice(i,1)
          break;
        }
      }
    }
    if (json.to == 'robotolux' && json.amount.split(' ')[1] == 'STEEM' && current > 26450000) {

      if (current < 27417440){
        const icoEntry = (current - 26450000)
        const weight = parseInt((Math.sqrt(1 - Math.pow(icoEntry/(967440), 2))/2 + 0.5)*1000000)
      } else {
        const icoEntry = (current - 20000) % 30240
        const weight = parseInt((Math.sqrt(1 - Math.pow(icoEntry/(30240), 2))/2 + 0.5)*1000000)
      }
      const amount = parseInt(parseFloat(json.amount) * 1000)
      state.ico.push({[json.from]:(weight * amount)})
      console.log(`${json.from} bid in DLUX auction with ${json.amount} with a ${weight} multiple`)
    } else if(json.to == 'dlux-io' && json.memo.substr(0,7) == 'DLUX_DEX'){
      const amount = parseInt(parseFloat(json.amount) * 1000)
      const rate = parseInt(json.memo)
      if (json.amount.split(' ')[1] == 'STEEM') { //rate = how many dlux to purchase for the amount paid
        state.dex.steem.buyOrders.push({from: json.from, buying: rate, amount: amount, [rate]:amount, rate:parseFloat(rate/amount).toFixed(6)})
        sortBuyArray(state.dex.steem.buyOrders, 'rate')
      } else {
        state.dex.sbd.buyOrders.push({from: json.from, buying: rate, amount: amount, [rate]:amount, rate:parseFloat(rate/amount).toFixed(6)})
        sortBuyArray(state.dex.sbd.buyOrders, 'rate')
      }
    } else if(json.memo.substr(0,7) == 'DLUX_DEX'){
      if (json.amount.split(' ')[1] == 'STEEM') {
        var buyAmount = parseInt(parseFloat(json.amount) * 1000)
        for (var i = 0; i < state.dex.steem.sellOrders.length; i++){
          if (state.dex.steem.sellOrders[i].from == json.to) {
            var amount = state.dex.steem.sellOrders[i].amount
            var rate = state.dex.steem.sellOrders[i].buying
            if (buyAmount > amount) {
              buyAmount = buyAmount - amount
              state.balances[json.from] += state.dex.steem.sellOrders[i].buying
              console.log(`@${json.from} purchased ${state.dex.steem.sellOrders[i].buying} DLUX from ${json.to} for ${buyAmount} STEEMon the DEX, with some to spare...`)
              state.dex.steem.tick = state.dex.steem.sellOrders[i].rate
              state.dex.steem.sellOrders.splice(i,1)
            } else if (buyAmount < amount) {
              var interim = parseInt(rate * buyAmount / amount)
              state.balances[json.from] += interim
              console.log(`@${json.from} purchased ${interim} DLUX from ${json.to} for ${json.amount} STEEM on the DEX`)
              state.dex.steem.sellOrders.push({from: json.to, buying: rate - interim, amount: amount - buyAmount, [rate-interim]:amount-buyAmount, rate:parseFloat((rate-interim)/(amount-buyAmount)).toFixed(6)})
              state.dex.steem.tick = state.dex.steem.sellOrders[i].rate
              state.dex.steem.sellOrders.splice(i,1)
              sortSellArray(state.dex.steem.sellOrders, 'rate')
            } else {
              state.balances[json.from] += rate
              console.log(`@${json.from} purchased ${rate} DLUX from ${json.to} for ${json.amount} STEEM on the DEX`)
              state.dex.steem.tick = state.dex.steem.sellOrders[i].rate
              state.dex.steem.sellOrders.splice(i,1)
              break;
            }
          }
        }
      } else {
        var buyAmount = parseInt(parseFloat(json.amount) * 1000)
        for (var i = 0; i < state.dex.sbd.sellOrders.length; i++){
          if (state.dex.sbd.sellOrders[i].from == json.to) {
            var amount = state.dex.sbd.sellOrders[i].amount
            var rate = state.dex.sbd.sellOrders[i].buying
            if (buyAmount > amount) {
              buyAmount = buyAmount - amount
              state.balances[json.from] += state.dex.sbd.sellOrders[i].buying
              console.log(`@${json.from} purchased ${state.dex.sbd.sellOrders[i].buying} DLUX from ${json.to} for ${buyAmount} SBD on the DEX, with some to spare... \nwill attempt to overflow order!`)
              state.dex.sbd.tick = state.dex.sbd.sellOrders[i].rate
              state.dex.sbd.sellOrders.splice(i,1)
            } else if (buyAmount < amount) {
              var interim = parseInt(rate * buyAmount / amount)
              state.balances[json.from] += interim
              console.log(`@${json.from} purchased ${interim} DLUX from ${json.to} for ${json.amount} SBD on the DEX`)
              state.dex.sbd.sellOrders.push({from: json.to, buying: rate - interim, amount: amount - buyAmount, [rate-interim]:amount-buyAmount, rate:parseFloat((rate-interim)/(amount-buyAmount)).toFixed(6)})
              state.dex.sbd.tick = state.dex.sbd.sellOrders[i].rate
              state.dex.sbd.sellOrders.splice(i,1)
              sortSellArray(state.dex.sbd.sellOrders, 'rate')
            } else {
              state.balances[json.from] += rate
              console.log(`@${from} purchased ${rate} DLUX from ${json.to} for ${json.amount} SBD on the DEX`)
              state.dex.sbd.tick = state.dex.sbd.sellOrders[i].rate
              state.dex.sbd.sellOrders.splice(i,1)
              break;
            }
          }
        }
      }
    }
  });

  processor.onOperation('delegate_vesting_shares', function(json,from){//grab posts to reward
    const vests = parseInt(parseFloat(json.vesting_shares)*1000000)
    if (json.delegatee == 'dlux-io' && vests){
      for (var i = 0; i < state.delegations.length;i++){
        if (state.delegators[i].delegations == json.delegator){
          state.delegations.splice(i,1)
          break;
        }
      }
        state.delegations.push({delegator:json.delegator,vests})
        console.log(`${json.delegator} has delegated ${vests} vests to @dlux-io`)
    } else if (json.delegatee == 'dlux-io' && !vests){
      for (var i = 0; i < state.delegations.length;i++){
        if (state.delegations[i].delegator == json.delegator){
          state.delegations.splice(i,1)
          break;
        }
      }
      console.log(`${json.delegator} has removed delegation to @dlux-io`)
    }
  });

  processor.onBlock(function(num, block) {
    current = num
    if(num % 100 === 0 && !processor.isStreaming()) {
      client.database.getDynamicGlobalProperties().then(function(result) {
        console.log('At block', num, 'with', result.head_block_number-num, 'left until real-time.')
      });
    }
    if(num % 100 === 5 && processor.isStreaming()) {
      check(num);
    }
    if(num % 100 === 50 && processor.isStreaming()) {
      report(num);
    }
    if(num > 27417440 && (num - 20000) % 30240  === 0) { //time for daily magic
      dao(num);
      if (round < 128){
        ico();round++;
      }
    }
    if (num == 27417440){firstAuction()}
    if(num % 100 === 0) {
      if(num >= 29504000){tally(num);}
      const blockState = Buffer.from(JSON.stringify([num, state]))
      plasma.hashBlock = num
      plasma.hashLastIBlock = hashThis(blockState)
      console.log(`Signing: ${plasma.hashLastIBlock}`)
      if(processor.isStreaming()){ipfsSaveState(num, blockState);}
    }
    if(processor.isStreaming() && escrow){
      var broadcast = false
      for (var i = 0; i < state.escrow[num].length; i++){
        if (state.escrow[i][0] = username){
          dsteem.broadcast(state.escrow[i][1], wif).then(function(result){
            console.log(`Approved escrow to ${state.escrow[i][1][1].to} from ${state.escrow[i][1][1].from} @ block` + result.block_num)
          }, function(error) {
            console.error(error)
          })
          broadcast = true
          break;
        }
      }
    }
  });

  processor.onStreamingStart(function() {
    console.log("At real time.")
  });

  processor.start();

  rl.on('line', function(data) {
    var split = data.split(' ');

    if(split[0] === 'balance') {
      var user = split[1];
      var balance = state.balances[user];
      if(balance === undefined) {
        balance = 0;
      }
      console.log(user, 'has', balance, 'tokens')
    } else if(split[0] === 'send') {
      console.log('Sending tokens...')
      var to = split[1];

      var amount = parseInt(split[2]);

      transactor.json(username, key, 'send', {
        to: to,
        amount: amount
      }, function(err, result) {
        if(err) {
          console.error(err);
        }
      })
    } else if(split[0] === 'exit') {
      exit();
    } else if(split[0] === 'state') {
      console.log(JSON.stringify(state, null, 2));
    } else {
      console.log("Invalid command.");
    }
  });
}

function check() { //do this maybe cycle 5, gives 15 secs to be streaming behind
  plasma.markets = {
    nodes: {},
    ipfss: {},
    relays: {}
  }
  for (var account in state.markets.node) {
    var self = state.markets.node[account].self
    plasma.markets.nodes[self] = {
      self: self,
      agreement: false,
    }
    var domain = state.markets.node[self].domain
    if (domain.slice(-1) == '/') {
      domain = domain.substring(0, domain.length - 1)
    }
    fetch(`${domain}/stats`)
      .then(function(response) {
        return response.json();
      })
      .then(function(myJson) {
        //console.log(JSON.stringify(myJson));
        if (state.stats.tokenSupply === myJson.stats.tokenSupply){
          plasma.markets.nodes[myJson.node].agreement = true
        }
      });
    }
}

function ico() {
  var j = 0
  for (var i = 0;i<state.ico.length;i++){
    for(var name in state.ico[i]){
      j += state.ico[i][name]
    }
  }
  for (var i = 0;i<state.ico.length;i++){
    for(var name in state.ico[i]){
      state.balances[name] += parseInt((state.ico[i][name]/j)*312500000)
    }
  }
  state.ico = []
}

function firstAuction(){
  var j = 0
  for (var i = 0;i<state.ico.length;i++){
    for(var name in state.ico[i]){
      j += state.ico[i][name]
    }
  }
  for (var i = 0;i<state.ico.length;i++){
    for(var name in state.ico[i]){
      state.balances[name] += parseInt((state.ico[i][name]/j)*20000000000)
    }
  }
  state.ico = []
}

function tally(num) {//tally state before save and next report
  var tally = {
    agreements: {
      runners: {},
      tally: {},
      votes: 0
    },
    election: {},
    winner: {},
    results: []
  }
  for (var node in state.runners){ //find out who is in the runners group
    tally.agreements.runners[node] = state.markets.node[node] //move the state data to tally to process
    tally.agreements.tally[node] = {
      self: node,
      votes: 0
    } //build a dataset to count
  }
  for (var node in tally.agreements.runners) { //cycle through this data
      if (tally.agreements.runners[node].report.agreements[node].agreement == true){ //only count what nodes believe are true
        tally.agreements.votes++ //total votes
        for (var subnode in tally.agreements.runners[node].report.agreements){
          if(tally.agreements.runners[node].report.agreements[subnode].agreement == true && tally.agreements.tally[subnode]){
            tally.agreements.tally[subnode].votes++
          }
        }
      }
  }
  var l = 0
  var consensus
  for (var node in state.runners){
      l++
    if (tally.agreements.tally[node].votes / tally.agreements.votes >= 2 / 3) {
      consensus = tally.agreements.runners[node].report.hash
    } else if(state.markets.node[node].report.hash !== state.stats.hashLastIBlock) {
      delete state.runners[node]
      console.log('uh-oh:' + node +' scored '+ tally.agreements.tally[node].votes + '/' + tally.agreements.votes)
    }
  }
  state.stats.lastBlock = state.stats.hashLastIBlock
  state.stats.hashLastIBlock = consensus
  for (var node in state.markets.node) {
      state.markets.node[node].attempts++
    if (state.markets.node[node].report.hash === state.stats.hashLastIBlock) {
      state.markets.node[node].yays++
      state.markets.node[node].lastGood = num
    }
  }
  if (l < 20) {
    for (var node in state.markets.node) {
      tally.election[node] = state.markets.node[node]
    }
    tally.results = []
    for (var node in state.runners){
      delete tally.election[node]
    }
    for (var node in tally.election){
      if (tally.election[node].report.hash !== state.stats.hashLastIBlock){
        delete tally.election[node]
      }
    }
    var t = 0
    for (var node in tally.election){
      t++
      tally.results.push([node, parseInt(((tally.election[node].yays / tally.election[node].attempts) * tally.election[node].attempts))])
    }
    if(t){
      tally.results.sort(function(a, b) {
        return a[1] - b[1];
      })
      tally.winner = tally.results.pop()
      state.runners[tally.winner[0]]= {
        self: state.markets.node[tally.winner[0]].self,
        domain: state.markets.node[tally.winner[0]].domain
      }
    }
  }
  for (var node in state.runners) {
    state.markets.node[node].wins++
  }
  //count agreements and make the runners list, update market rate for node services
  var mint = parseInt(state.stats.tokenSupply/state.stats.interestRate)
  state.stats.tokenSupply += mint
  state.balances.ra += mint
}

function dao(num) {
  var i,j,b,t=0
  t = state.balances.ra
  for (var nodes in state.runners){ //node rate
    b += state.markets.node[node].marketingRate
    j += state.markets.node[node].bidRate;i++
  }
  state.stats.marketingRate = parseInt(b/i)
  state.stats.nodeRate = parseInt(j/i)
  state.balances.rn += parseInt(t*state.stats.nodeRate/10000)
  state.balances.ra -= state.balances.rn
  i,j=0
  for (var nodes in state.markets.node){ //tally the wins
    j += state.markets.node[node].wins
  }
  b = state.balanances.rn
  for (var nodes in state.markets.node){ //and pay them
    i = parseInt(state.markets.node[node].wins/j*b)
    state.balances[node] += i
    state.balances.rn -= i
    state.markets.node[node].wins = 0
  }
  state.balances.rd = parseInt(t*10000/state.stats.delegationRate) // 10% to delegators
  state.balances.ra -= state.balances.rd
  b=state.balanances.rd
  j=0
  for (i = 0; i<state.delegations.length;i++){ //count vests
    j += state.delegations[i].vests
  }
  for (i = 0; i<state.delegations.length;i++){ //reward vests
    k = parseInt(b*state.delegations[i].vests/j)
    state.balances[state.delegations[i].delegator] += k
    state.balances.rd -= k
  }
  /*
  take ra and disperse over 1-7 by table weights
  //budget for contracts
  reward contents
  //savings rate?
  //ipfs
  //reward_relays

  //8 accounts
  //disperses ICO bids
  */
  for(i=0;i<state.pending.length;i++){//clean up markets after 30 days
    if(state.pending[i][3]<num-864000){state.pending.splice(i,1)}
  }
  for (var contract in state.contracts){
    if (state.contracts[contract].block < num - 864000){
      state.balances[state.contracts[contract].from] += state.contracts[contract].amount
      if (state.contracts[contract].reject){
        state.pending.push(state.contracts[contract].reject)
      }
      if (state.contracts[contract].steem){
        for(i=0;i < state.dex.steem.length;i++){
          if (state.dex.steem.sellOrders[i].txid == state.contracts[contract].txid){
            state.dex.steem.sellOrders.splice(i,1)
            break;
          }
        }
        for(i=0;i < state.dex.steem.length;i++){
          if (state.dex.steem.buyOrders[i].txid == state.contracts[contract].txid){
            state.dex.steem.buyOrders.splice(i,1)
            break;
          }
        }
      } else {
        {
          for(i=0;i < state.dex.sbd.length;i++){
            if (state.dex.sbd.sellOrders[i].txid == state.contracts[contract].txid){
              state.dex.sbd.sellOrders.splice(i,1)
              break;
            }
          }
          for(i=0;i < state.dex.sbd.length;i++){
            if (state.dex.sbd.buyOrders[i].txid == state.contracts[contract].txid){
              state.dex.sbd.buyOrders.splice(i,1)
              break;
            }
          }
        }
      }
      delete state.contracts[contract]
    }
  }
  //orders

}

function report(num) {
  agreements = {}
  if (plasma.markets) {
    for (var node in plasma.markets.nodes){
      var self = plasma.markets.nodes[node].self;
      if (plasma.markets.nodes[self].agreement){
        agreements[self] = {
          node: self,
          agreement: true
        }
      }
    }
    for (var node in state.runners){
      var self = state.runners[node].self;
      if (agreements[self]) {
        agreements[self].top = true
      } else if (plasma.markets.nodes[self].agreement) {
        agreements[self] = {
          node: self,
          agreement: true
        }
      } else {
        agreements[self] = {
          node: self,
          agreement: false
        }
      }
    }
    /*
    transactor.json(username, key, 'report', {
        agreements: agreements,
        hash: plasma.hashLastIBlock,
        block: plasma.hashBlock,
        version: VERSION,
        escrow: escrow
      }, function(err, result) {
        if(err) {
          console.error(err, `\nMost likely your ACCOUNT and KEY variables are not set!`);
        } else {
          console.log(`Sent State report and published ${plasma.hashLastIBlock} for ${plasma.hashBlock}`)
        }
    })//sum plasma and post a transaction
    */
  }
}

function exit() {
  console.log('Exiting...');
  processor.stop(function() {
    saveState(function() {
      process.exit();
      console.log('Process exited.');
    });
  });
}

function saveState(callback) {
  var currentBlock = processor.getCurrentBlockNumber();
  fs.writeFileSync(stateStoreFile, JSON.stringify([currentBlock, state]));
  callback();
}

function ipfsSaveState(blocknum, hashable) {
  ipfs.add(hashable, (err, ipfsHash) => {
    if (!err){
      plasma.hashLastIBlock = ipfsHash[0].hash
      console.log('Saved: ' + ipfsHash[0].hash)
    } else {
      console.log({cycle}, 'Non-Hash returned', ipfsHash[0].hash)
      cycleIPFS(cycle++)
      if (cycle >= 25){
        cycle = 0;
        return;
      }
    }
  })
};

function sortBuyArray (array, key) {
  return array.sort(function(a,b) { return a[key] - b[key];});
}
function sortSellArray (array, key) {
  return array.sort(function(a,b) { return a[key] + b[key];});
}
