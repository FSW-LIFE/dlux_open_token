const steem = require('dsteem');
const steemState = require('./processor');
const steemTransact = require('steem-transact');
const readline = require('readline');
const safeEval = require('safe-eval');
const IPFS = require('ipfs-api');
var aesjs = require('aes-js');
const ipfs = new IPFS({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
});
const args = require('minimist')(process.argv.slice(2));
const express = require('express')
const cors = require('cors')
const steemClient = require('steem')
const fs = require('fs-extra');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
const config = require('./config');
const rtrades = require('./rtrades');
var Pathwise = require('./pathwise');
var level = require('level');

var store = new Pathwise(level('./db', {createIfEmpty: true}));

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
const testing = true
const VERSION = 'v0.0.3a'
const api = express()
var http = require('http').Server(api);
//const io = require('socket.io')(http)
var escrow = false
var broadcast = 1
const wif = steemClient.auth.toWif(config.username, config.active, 'active')
const resteemAccount = 'dlux-io';
var startingBlock = 32255701;
var current, dsteem, testString

const prefix = 'dluxT_';
const streamMode = args.mode || 'irreversible';
console.log("Streaming using mode", streamMode);
var client = new steem.Client(config.clientURL);
var processor;

var pa = []

const Unixfs = require('ipfs-unixfs')
const {
    DAGNode
} = require('ipld-dag-pb')

function hashThis2(datum) {
    const data = Buffer.from(datum, 'ascii')
    const unixFs = new Unixfs('file', data)
    DAGNode.create(unixFs.marshal(), (err, dagNode) => {
        if (err) {
            return console.error(err)
        }
        console.log(hashThis2(JSON.stringify(dagNode)))
        return hashThis2(JSON.stringify(dagNode)) // Qmf412jQZiuVUtdgnB36FXFX7xg5V6KEbSJ4dpQuhkLyfD
    })
}
// Read line for CLI access
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Cycle through good public IPFS gateways
var cycle = 0

function cycleipfs(num) {
    //ipfs = new IPFS({ host: state.gateways[num], port: 5001, protocol: 'https' });
}

if (config.active && config.NODEDOMAIN) {
    escrow = true
    dsteem = new steem.Client('https://api.steemit.com')
}
var https_redirect = function(req, res, next) {
    if (process.env.NODE_ENV === 'production') {
        if (req.headers['x-forwarded-proto'] != 'https') {
            return res.redirect('https://' + req.headers.host + req.url);
        } else {
            return next();
        }
    } else {
        return next();
    }
};

api.use(https_redirect);
api.use(cors())
api.get('/', (req, res, next) => {
    var stats = {}
    res.setHeader('Content-Type', 'application/json')
    store.get(['stats'], function(err, obj) {
        stats = obj,
            res.send(JSON.stringify({
                stats
            }, null, 3))
    });
});
api.get('/@:un', (req, res, next) => {
    let un = req.params.un
    var bal = new Promise(function(resolve, reject) {
        store.get(['balances', un], function(err, obj) {
            if (err) {
                reject(err)
            } else {
                if (typeof obj != 'number') {
                    resolve(0)
                } else {
                    resolve(obj)
                }
            }
        });
    });
    var pb = new Promise(function(resolve, reject) {
        store.get(['pow', un], function(err, obj) {
            if (err) {
                reject(err)
            } else {
                if (typeof obj != 'number') {
                    resolve(0)
                } else {
                    resolve(obj)
                }
            }
        });
    });
    var lp = new Promise(function(resolve, reject) {
        store.get(['pow', 'n', un], function(err, obj) {
            if (err) {
                reject(err)
            } else {
                if (typeof obj != 'number') {
                    resolve(0)
                } else {
                    resolve(obj)
                }
            }
        });
    });
    var contracts = new Promise(function(resolve, reject) {
        store.get(['contracts', un], function(err, obj) {
            if (err) {
                reject(err)
            } else {
                resolve(obj)
            }
        });
    });
    res.setHeader('Content-Type', 'application/json');
    Promise.all([bal, pb, lp, contracts])
        .then(function(v) {
            console.log(bal, pb, lp, contracts)
            res.send(JSON.stringify({
                balance: v[0],
                poweredUp: v[1],
                powerBeared: v[2],
                contracts: v[3]
            }, null, 3))
        })
        .catch(function(err) {
            console.log(err)
        })
});
api.get('/stats', (req, res, next) => {
    var stats = {}
    res.setHeader('Content-Type', 'application/json')
    store.get(['stats'], function(err, obj) {
        stats = obj,
            res.send(JSON.stringify({
                stats
            }, null, 3))
    });
});
api.get('/state', (req, res, next) => {
    var state = {}
    res.setHeader('Content-Type', 'application/json')
    store.get([], function(err, obj) {
        state = obj,
            res.send(JSON.stringify({
                state
            }, null, 3))
    });
});
api.get('/pending', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(NodeOps, null, 3))
});
api.get('/runners', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json')
    store.get(['runners'], function(err, obj) {
        var runners = obj
        res.send(JSON.stringify({
            runners,
            node: config.username,
            VERSION,
            realtime: current
        }, null, 3))
    });
});
api.get('/feed', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json')
    store.get(['feed'], function(err, obj) {
        var feed = obj
        res.send(JSON.stringify({
            feed,
            node: config.username,
            VERSION,
            realtime: current
        }, null, 3))
    });
});
api.get('/fresh', (req, res, next) => {
    let page = req.query.page || 0
    res.setHeader('Content-Type', 'application/json')
    var ip = page && typeof page == 'number' ? plasma.page[page] : realtime
    store.someChildren(['posts'],{lte:ip,gte:plasma.page[page]}, function(err, obj) {
        var feed = []
        for (i in obj){
          feed.push(i)
          if(feed.length==25){
            if( typeof page == 'number' && page > plasma.page.length) {
              plasma.page.push(i)
            }
            else if(typeof page == 'number' && page >= 0) {
              plasma.page.push(i)
            } else {
              plasma.page[page] = i
            }
            break;}
        }
        res.send(JSON.stringify({
            feed,
            node: config.username,
            VERSION,
            realtime: current
        }, null, 3))
    });
});
api.get('/markets', (req, res, next) => {
    var markets = new Promise(function(resolve, reject) {
        store.get(['markets'], function(err, obj) {
            if (err) {
                reject(err)
            } else {
                resolve(obj)
            }
        });
    });
    var stats = new Promise(function(resolve, reject) {
        store.get(['stats'], function(err, obj) {
            if (err) {
                reject(err)
            } else {
                resolve(obj)
            }
        });
    });
    res.setHeader('Content-Type', 'application/json');
    Promise.all([markets, stats])
        .then(function(v) {
            res.send(JSON.stringify({
                markets: v[0],
                stats: v[1],
                node: config.username,
                VERSION,
                realtime: current
            }, null, 3))
        })
        .catch(function(err) {
            console.log(err)
        })
});
api.get('/dex', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    var dex = new Promise(function(resolve, reject) {
        store.get(['dex'], function(err, obj) {
            if (err) {
                reject(err)
            } else {
                resolve(obj)
            }
        });
    });
    var queue = new Promise(function(resolve, reject) {
        store.get(['queue'], function(err, obj) {
            if (err) {
                reject(err)
            } else {
                resolve(obj)
            }
        });
    });
    res.setHeader('Content-Type', 'application/json');
    Promise.all([dex, queue])
        .then(function(v) {
            res.send(JSON.stringify({
                markets: v[0],
                queue: v[1],
                node: config.username,
                VERSION,
                realtime: current
            }, null, 3))
        })
        .catch(function(err) {
            console.log(err)
        })
});
api.get('/report/:un', (req, res, next) => {
    let un = req.params.un
    res.setHeader('Content-Type', 'application/json')
    store.get(['markets', 'node', un, 'report'], function(err, obj) {
        var report = obj
        res.send(JSON.stringify({
            [un]: report,
            node: config.username,
            VERSION,
            realtime: current
        }, null, 3))
    });
});
//api.listen(port, () => console.log(`DLUX token API listening on port ${port}!\nAvailible commands:\n/@username =>Balance\n/stats\n/markets`))
http.listen(config.port, function() {
    console.log(`DLUX token API listening on port ${config.port}`);
});
var utils = {
    chronoSort: function() {
        var sorted
        store.get(['chrono'], function(err, obj) {
            sorted = obj
            sorted.sort(function(a, b) {
                return a.block - b.block
            });
            store.batch([{type:'put',path:['chrono'], data: sorted}])
        });
    },
    cleaner: function(num, prune) { //memory management with out lossing private data(individually shardable)
        var nodes
        store.get(['markets', 'node'], function(err, obj) {
            nodes = obj
            for (var node in nodes) {
                if (nodes[node].report.block < num - prune || 28800) {
                    if (nodes[node].report.stash && nodes[node].report.stash.length < 255 && typeof nodes[node].report.stash.length === 'string') {
                        var temp = {
                            stash: nodes[node].report.stash,
                            hash: nodes[node].report.hash
                        }
                        delete nodes[node].report
                        nodes[node].report = temp
                    } else {
                        delete nodes[node].report
                    }
                }
            }
            store.batch([{type:'put',path:['markets', 'node'], data:nodes}])
        });
    },
    agentCycler: function() {
        var queue
        store.get(['queue'], function(err, obj) {
            queue = obj
            var x = queue.shift();
            queue.push(x);
            return x
            store.batch([{type:'put',path:['queue'], data: queue}])
        });
    },
    cleanExeq: function(id) {
        var exeq
        store.get(['exeq'], function(err, obj) {
            exeq = obj
            for (var i = 0; i < exeq.length; i++) {
                if (exeq[i][1] == id) {
                    exeq.splice(i, 1)
                    i--;
                }
            }
            store.batch([{type:'put',path:['exeq'], data:exeq}])
        });
    }
}

var plasma = {},
    jwt
var NodeOps = []
var rtradesToken = ''
const transactor = steemTransact(client, steem, prefix);
var selector = 'dlux-io'
if (config.username == selector) {
    selector = `https://dlux-token-markegiles.herokuapp.com/`
} else {
    selector = `https://token.dlux.io/markets`
}
if (config.rta && config.rtp) {
    rtrades.handleLogin(config.rta, config.rtp)
}
if (config.engineCrank) {
    startWith(config.engineCrank)
} else {
    fetch(selector)
        .then(function(response) {
            return response.json();
        })
        .then(function(myJson) {
            if (myJson.markets.node[config.username]) {
                if (myJson.markets.node[config.username].report.stash) {
                    ipfs.cat(myJson.markets.node[config.username].report.stash, (err, file) => {
                        if (!err) {
                            var data = JSON.parse(file);
                            Private = data;
                            console.log(`Starting from ${myJson.markets.node[config.username].report.hash}\nPrivate encrypted data recovered`)
                            startWith(myJson.markets.node[config.username].report.hash)
                        } else {
                            console.log(`Lost Stash... Abandoning and starting from ${myJson.stats.hashLastIBlock}`) //maybe a recovery fall thru?
                            startWith(myJson.markets.node[config.username].report.hash);
                        }
                    });
                } else {
                    console.log(`No Private data found\nStarting from ${myJson.markets.node[config.username].report.hash}`)
                    startWith(myJson.stats.hashLastIBlock) //myJson.stats.hashLastIBlock);
                }
            } else {
                console.log(`Starting from ${myJson.markets.node['dlux-io'].report}`)
                startWith(myJson.stats.hashLastIBlock);
            }
        })
        .catch(error => {
            console.log(error, `\nStarting 'startingHash': ${config.engineCrank}`);
            startWith(config.engineCrank);
        });
}

// Special Attention
function startWith(sh) {
    if (sh) {
        console.log(`Attempting to start from IPFS save state ${sh}`);
        ipfs.cat(sh, (err, file) => {
            if (!err) {
                var data = JSON.parse(file);
                //startingBlock = data[0]
                plasma.hashBlock = data[0]
                plasma.hashLastIBlock = sh
                //store.batch([{type:'del',path:[]}])
                store.del([],function(e){
                  if(!e){
                    store.put([], data[1], function(err) {
                        if(err){ console.log(err)} else{
                          store.get(['balances','ra'],function(error,returns){
                            if(!error){
                              console.log(returns)
                            }
                          })
                          startApp()
                        }
                    })
                  } else {console.log(e)}
                })
                data[1] = {
    "limbo": {},
    "listeners": [],
    "balances": {
        "ra": 1603708,
        "rb": 0,
        "rc": 7653494,
        "rd": 11,
        "re": 0,
        "ri": 998283978,
        "rr": 0,
        "rn": 2,
        "rm": 13038493,
        "kellie.leigh": 50000000,
        "surfyogi": 12000000,
        "sunlakeslady": 3000000,
        "bitduck86": 2000000,
        "a1-shroom-spores": 52799200,
        "vasqus": 2000000,
        "phteven.withap": 2000000,
        "cowboys.angel": 5000000,
        "paint.baller": 7500000,
        "dlux-io": 1007644281,
        "disregardfiat": 8117705,
        "eastmael": 27059946,
        "elgeko": 15416780,
        "gabbagallery": 15404885,
        "cryptoandzen": 109258596,
        "markegiles": 12085042,
        "whatsup": 6814697,
        "d-pend": 1159715,
        "flash07": 223795,
        "onealfa": 3306848,
        "kriptonik": 41919297,
        "gabbynhice": 989665,
        "ackza": 21750658,
        "pangoli": 3372429,
        "fyrstikken": 28769708,
        "angelveselinov": 138714,
        "michelios": 22237961,
        "masterthematrix": 5132481,
        "taskmaster4450": 3787005,
        "direwolf": 14650724,
        "jznsamuel": 1929087,
        "bobby.madagascar": 12952720,
        "itstime": 2517296,
        "igster": 3501352,
        "deybacsi": 14142,
        "protegeaa": 11494677,
        "gattino": 538201,
        "mannacurrency": 234835,
        "seareader1": 586855,
        "pocketrocket": 114545,
        "preparedwombat": 3726554,
        "janusface": 2287632,
        "nataboo": 133242,
        "j85063": 854021,
        "b-s": 3392179,
        "caramaeplays": 5371565,
        "inconceivable": 406346,
        "bubke": 3773700,
        "okean123": 188645,
        "blockcryptochain": 75434,
        "bryan-imhoff": 619917,
        "shellyduncan": 1424081,
        "east.autovote": 0,
        "snubbermike": 3977499,
        "flauwy": 0,
        "theycallmedan": 2574172,
        "tkept260": 22206524,
        "runicar": 5253291,
        "acidyo": 33220275,
        "lanmower": 465318,
        "tarazkp": 20468613,
        "juvyjabian": 4715237,
        "stackin": 182536,
        "organduo": 0,
        "dera123": 2183259,
        "rovill": 1375502,
        "tracilin": 95541004,
        "elementm": 739379,
        "doon": 1645964,
        "superlotto": 938825,
        "chrismgiles": 52084713,
        "kenny-crane": 5066074,
        "altrosa": 362477,
        "shredz7": 1943431,
        "dlux-highway": 1594578,
        "dlux-sm": 791577,
        "theb0red1": 2876369,
        "onthewayout": 6477197,
        "syedumair": 1300146,
        "austindro": 6328417,
        "kohost": 1101498,
        "yasu24": 4353,
        "novacadian": 380742,
        "alexvanaken": 28344,
        "nekomuneca": 6000000,
        "suzanoslin": 6000000,
        "achimmertens": 198125,
        "flora-francis": 3200000,
        "azuremoon": 4545,
        "qwoyn": 9090,
        "buckydurddle": 63757,
        "dlux-treasure": 1000,
        "ecoinstar": 9123
    },
    "pow": {
        "n": {},
        "t": 8300000000,
        "disregardfiat": 1000000000,
        "markegiles": 1000000000,
        "shredz7": 100000000,
        "a1-shroom-spores": 100000000,
        "caramaeplays": 100000000,
        "dlux-io": 6000000000,
        "robotolux": 0
    },
    "rolling": {},
    "nft": {},
    "chrono": [],
    "pending": [],
    "exeq": [],
    "exes": [],
    "queue": ["inconceivable", "dlux-io", "markegiles", "disregardfiat"],
    "escrow": {},
    "bannedNodes": [],
    "agents": {
        "dlux-io": {
            "self": "dlux-io",
            "queue": [],
            "online": true
        }
    },
    "delegations": {
      achimmertens: 400056928307,
      blockcryptochain: 20186584362,
      "bobby.madagascar": 199848965430,
      bubke: 1009371232275,
      buckydurddle: 599409998448,
      dera123: 101886031929,
      direwolf: 20616896980,
      disregardfiat: 20115916810,
      eastmael: 199747641576,
      ecoinstar: 199757366360,
      elementm: 19977817670,
      flash07: 20187819550,
      j85063: 201870966828,
      jznsamuel: 201798905991,
      kriptonik: 200952516306,
      masterthematrix: 301484502951,
      michelios: 4003079453843,
      novacadian: 200343431865,
      okean123: 50466716897,
      onthewayout: 2005640925153,
      preparedwombat: 201875204241,
      superlotto: 251119699919,
      syedumair: 300845301398,
      tarazkp: 1205958434476,
      taskmaster4450: 201876824153,
      theb0red1: 2002253743110,
      yasu24: 2004134932
    },
    "stats": {
        "tokenSupply": 11153569817,
        "interestRate": 2100000,
        "nodeRate": 2166,
        "IPFSRate": 2000,
        "budgetRate": 2000,
        "maxBudget": 1000000000,
        "savingsRate": 1000,
        "marketingRate": 833,
        "resteemReward": 10000,
        "delegationRate": 2000,
        "currationRate": 2000,
        "icoPrice": 220,
        "outOnBlock": 0,
        "lastBlock": "QmZrySGT91mC2pcFWq9o8RvMAVJFFdasfbxUMgg5PNdXHG",
        "hashLastIBlock": "Qmc1Teyx5XS4tS6ZFffuhbXSqsyHZCnqgsXHx8Tm9dvtK5"
    },
    "dex": {
        "steem": {
            "tick": "0.222222",
            "buyOrders": [],
            "sellOrders": [],
            "his": [],
            "days": [],
            "weeks": [],
            "months": []
        },
        "sbd": {
            "tick": "0.100000",
            "buyOrders": [],
            "sellOrders": [{
            }],
            "his": [{}],
            "days": [],
            "weeks": [],
            "months": []
        }
    },
    "runners": {
        "dlux-io": {
            "self": "dlux-io",
            "domain": "https://token.dlux.io"
        },
        "markegiles": {
            "self": "markegiles",
            "domain": "https://dlux-token-markegiles.herokuapp.com"
        },
        "inconceivable": {
            "self": "inconceivable",
            "domain": "https://dlux-token.herokuapp.com/"
        }
    },
    "markets": {
        "node": {
            "dlux-io": {
                "self": "dlux-io",
                "domain": "https://token.dlux.io",
                "bidRate": 2500,
                "marketingRate": 2500,
                "attempts": 39047,
                "yays": 14190,
                "wins": 302,
                "contracts": 0,
                "lastGood": 32255700,
                "transfers": 0,
                "report": {
                    "feed": ["df62e44311c92f59ee5a4697fdda6ea644419d4d|32255576:@inconceivable - report has been processed", "0d8377371849c213112ad6a10f74d69a359048ef|32255575:@dlux-io - report has been processed", "78443a0378a709a3442c46583d8b63d3c70298a1|32255575:@markegiles - report has been processed"],
                    "agreements": {
                        "dlux-io": {
                            "node": "dlux-io",
                            "agreement": true,
                            "top": true
                        },
                        "markegiles": {
                            "node": "markegiles",
                            "agreement": true,
                            "top": true
                        },
                        "inconceivable": {
                            "node": "inconceivable",
                            "agreement": false
                        }
                    },
                    "hash": "Qmc1Teyx5XS4tS6ZFffuhbXSqsyHZCnqgsXHx8Tm9dvtK5",
                    "block": 32255601,
                    "version": "v0.0.3a",
                    "escrow": true,
                    "transaction_id": "1da90187823852d0c642c3703e82dce0e4339037",
                    "block_num": 32255678
                }
            },
            "disregardfiat": {
                "self": "disregardfiat",
                "attempts": 3729,
                "yays": 1689,
                "wins": 0,
                "contracts": 0,
                "escrows": 0,
                "lastGood": 32136800,
                "report": {
                    "feed": ["ac913f2977925d82900985a5996a924b9b6fb6aa|32142067:@disregardfiat - report has been processed", "7af5b2b05ae814b0a61a00f6f8751b9d02c1898b|32142067:@dlux-io - report has been processed", "3046c11972e808ae1b6705a9986bcea2d8fdbdda|32142067:@markegiles - report has been processed", "ac913f2977925d82900985a5996a924b9b6fb6aa|32142067:@disregardfiat - report has been processed", "7af5b2b05ae814b0a61a00f6f8751b9d02c1898b|32142067:@dlux-io - report has been processed", "3046c11972e808ae1b6705a9986bcea2d8fdbdda|32142067:@markegiles - report has been processed"],
                    "agreements": {
                        "disregardfiat": {
                            "node": "disregardfiat",
                            "agreement": true
                        },
                        "dlux-io": {
                            "node": "dlux-io",
                            "agreement": true,
                            "top": true
                        },
                        "markegiles": {
                            "node": "markegiles",
                            "agreement": true,
                            "top": true
                        }
                    },
                    "hash": "QmZQLivyBMA2pe6U8s6bDfuaauC7VsHWhpMzJVZV5Qj6Bh",
                    "block": 32142101,
                    "version": "v0.0.3a",
                    "escrow": true,
                    "transaction_id": "add07cc9d06345476135f406c5b7cbe788ba77eb",
                    "block_num": 32142175
                },
                "escrow": true,
                "domain": "http://dlux-token.herokuapp.com",
                "bidRate": 2000,
                "marketingRate": 0
            },
            "markegiles": {
                "self": "markegiles",
                "attempts": 3724,
                "yays": 2663,
                "wins": 301,
                "contracts": 0,
                "escrows": 0,
                "lastGood": 32255700,
                "report": {
                    "feed": ["df62e44311c92f59ee5a4697fdda6ea644419d4d|32255576:@inconceivable - report has been processed", "0d8377371849c213112ad6a10f74d69a359048ef|32255575:@dlux-io - report has been processed", "78443a0378a709a3442c46583d8b63d3c70298a1|32255575:@markegiles - report has been processed"],
                    "agreements": {
                        "markegiles": {
                            "node": "markegiles",
                            "agreement": true,
                            "top": true
                        },
                        "dlux-io": {
                            "node": "dlux-io",
                            "agreement": true,
                            "top": true
                        },
                        "inconceivable": {
                            "node": "inconceivable",
                            "agreement": false
                        }
                    },
                    "hash": "Qmc1Teyx5XS4tS6ZFffuhbXSqsyHZCnqgsXHx8Tm9dvtK5",
                    "block": 32255601,
                    "version": "v0.0.3a",
                    "escrow": true,
                    "transaction_id": "9efb09fd6dbbdeb9bb479b31c61df8eed251e390",
                    "block_num": 32255677
                },
                "escrow": true,
                "domain": "https://dlux-token-markegiles.herokuapp.com",
                "bidRate": 2000,
                "marketingRate": 0
            },
            "inconceivable": {
                "domain": "https://dlux-token.herokuapp.com/",
                "self": "inconceivable",
                "bidRate": 2000,
                "marketingRate": 0,
                "attempts": 1516,
                "yays": 1346,
                "wins": 297,
                "contracts": 0,
                "escrows": 0,
                "lastGood": 32255700,
                "report": {
                    "feed": ["df62e44311c92f59ee5a4697fdda6ea644419d4d|32255576:@inconceivable - report has been processed", "0d8377371849c213112ad6a10f74d69a359048ef|32255575:@dlux-io - report has been processed", "78443a0378a709a3442c46583d8b63d3c70298a1|32255575:@markegiles - report has been processed"],
                    "agreements": {
                        "inconceivable": {
                            "node": "inconceivable",
                            "agreement": true,
                            "top": true
                        },
                        "dlux-io": {
                            "node": "dlux-io",
                            "agreement": true,
                            "top": true
                        },
                        "markegiles": {
                            "node": "markegiles",
                            "agreement": true,
                            "top": true
                        }
                    },
                    "hash": "Qmc1Teyx5XS4tS6ZFffuhbXSqsyHZCnqgsXHx8Tm9dvtK5",
                    "block": 32255601,
                    "version": "v0.0.3a",
                    "escrow": true,
                    "transaction_id": "e08327a7861f9b4740b7df8e3027408ba40a94ee",
                    "block_num": 32255678
                },
                "escrow": true
            }
        }
    },
    "feed": {},
    "nomention": {
        "disregardfiat": true
    }
}
            } else {
                startWith(config.engineCrank)
                console.log(`${sh} failed to load, Replaying from genesis.\nYou may want to set the env var STARTHASH\nFind it at any token API such as token.dlux.io`)
            }
        });
    } else {
        startApp()
    }
}


function startApp() {
    processor = steemState(client, steem, startingBlock, 10, prefix, streamMode);

    processor.on('send', function(json, from, active) {
        store.get(['balances', from], function(e, fbal) {
            store.get(['balances', json.to], function(er, tb) {
                if (er) {
                    console.log(er)
                } else {
                    tbal, ops=[]
                    tbal = typeof tb != 'number' ? 0 : tb
                    if (json.to && typeof json.to == 'string' && typeof json.amount == 'number' && (json.amount | 0) === json.amount && json.amount >= 0 && fbal >= json.amount && active) {
                        ops.push({type:'put',path:['balances', from], data:(fbal - json.amount)})
                        ops.push({type:'put',path:['balances', json.to], data:(tbal + json.amount)})
                        ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data:`Send occurred from @${from} to @${json.to} of ${parseFloat(json.amount/1000).toFixed(3)}DLUX`})
                    } else {
                        ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`],data: `Invalid send operation from @${from}`})
                    }
                    store.batch(ops)
                }
            });
        })

    });

    // power up tokens
    processor.on('power_up', function(json, from, active) {
        var amount = parseInt(json.amount),
            lbal, pbal
        store.get(['balances', from], function(e, lb) {
            store.get(['pow', 't'], function(er, tpow) {
                store.get(['pow', from], function(err, pow) {
                    es = []
                    if (e) es.push(e)
                    if (er) es.push(er)
                    if (err) es.push(err)
                    if (es.length) {
                        console.log({
                            es
                        })
                    } else {
                        lbal = typeof lb != 'number' ? 0 : lb
                        pbal = typeof pow != 'number' ? 0 : pow
                        ops=[]
                        if (amount < lbal && active) {
                            ops.push({type:'put',path:['balances', from], data: lbal - amount})
                            ops.push({type:'put',path:['pow', from], data: pbal + amount})
                            ops.push({type:'put',path:['pow', 't'], data: tpow + amount})
                            ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data: `Power up occurred by @${from} of ${parseFloat(json.amount/1000).toFixed(3)} DLUX`})
                            ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data: `Power up occurred by @${from} of ${parseFloat(json.amount/1000).toFixed(3)} DLUX`})
                        } else {
                            ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data:`Invalid power up operation from @${from}`})
                        }
                        store.batch(ops)
                    }
                });
            });
        })
    });

    // power down tokens
    processor.on('power_down', function(json, from, active) {
        var amount = parseInt(json.amount),
            p
        store.get(['pow', from], function(e, o) {
            if (e) console.log(e)
            p = typeof o != 'number' ? 0 : o,ops=[]
            if (typeof amount == 'number' && amount >= 0 && p >= amount && active) {
                var odd = parseInt(amount % 13),
                    weekly = parseInt(amount / 13)
                for (var i = 0; i < 13; i++) {
                    if (i == 12) {
                        weekly += odd
                    }
                    var chronAssign
                    store.someChildren(['chrono'], {
                        gte: "" + parseInt(json.block_num + 300000),
                        lte: "" + parseInt((json.block_num + 300000) + 1)
                    }, function(e, a) {
                        if (e) {
                            console.log(e)
                        } else {
                            if (a.length && a.length < 10) {
                                chronAssign = a.length
                            } else if (a.length < 36) {
                                chronAssign = String.fromCharCode(a.length + 55)
                            } else if (a.length < 62) {
                                chronAssign = String.fromCharCode(a.length + 61)
                            }
                            if (!chronAssign) {
                                chronAssign = `${json.block_num + (200000 * (i + 1))}:0`
                            } else {
                                var temp = chronAssign
                                chronAssign = `${json.block_num + (200000 * (i + 1))}:${temp}`
                            }
                            ops.push({type:'put',path:['chrono', chronAssign], data: {
                                block: parseInt(json.block_num + (200000 * (i + 1))),
                                op: 'power_down',
                                amount: weekly,
                                by: from
                            }})
                        }
                    })
                }
                ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data: `Power down occurred by @${from} of ${parseFloat(amount/1000).toFixed(3)} DLUX`})
            } else {
                ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data: `Invalid power up operation from @${from}`})
            }
            store.batch(ops)
        })
    });

    // vote on content
    processor.on('vote_content', function(json, from, active) {
        var powPromise = new Promise(function(resolve, reject) {
            store.get(['pow', from], function(e, a) {
                if (e) {
                    reject(e)
                } else if (a == {}) {
                    resolve(0)
                } else {
                    resolve(a)
                }
            });
        })
        var postPromise = new Promise(function(resolve, reject) {
            store.get(['posts', `${json.author}/${json.permlink}`], function(e, a) {
                if (e) {
                    reject(e)
                } else if (a == {}) {
                    resolve(0)
                } else {
                    resolve(a)
                }
            });
        })
        var rollingPromise = new Promise(function(resolve, reject) {
            store.get(['rolling', from], function(e, a) {
                if (e) {
                    reject(e)
                } else if (a == {}) {
                    resolve(0)
                } else {
                    resolve(a)
                }
            });
        })
        var nftPromise = new Promise(function(resolve, reject) {
            store.get(['pow', 'n', from], function(e, a) {
                if (e) {
                    reject(e)
                } else if (a == {}) {
                    resolve(0)
                } else {
                    resolve(a)
                }
            });
        })
        Promise.all([powPromise, postPromise, rollingPromise, nftPromise])
            .then(function(v) {
                var pow = v[0],
                    post = v[1],
                    rolling = v[2],
                    nft = v[3],
                    ops=[]
                if (pow >= 1) {
                    if (post) {
                        if (!rolling) {
                            rolling = parseInt((nft + pow) * 10)
                        }
                        const w = json.weight > 0 && json.weight < 10001 ? parseInt(json.weight * rolling / 100000) : parseInt(rolling / 10)
                        post.totalWeight += parseInt(json.weight * rolling / 100000)
                        post.voters.push({
                            from: from,
                            weight: w
                        })
                        ops.push({type:'put',path:['posts', `${json.block_num}`,`${json.author}/${json.permlink}`],data: post})
                        ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`],data: `${from} voted for @${json.author}/${json.permlink}`})
                        rolling -= w
                        ops.push({type:'put',path:['rolling', from], data: rolling})
                    } else {
                        ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data: `@${from} tried to vote for an unknown post`})
                    }
                } else {
                    ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data: `@${from} doesn't have the dlux power to vote`})
                }
                store.batch(ops)
            })
            .catch(function(e) {
                console.log(e)
            });
    });

    processor.on('dex_buy', function(json, from, active) {
      var Pbal = new Promise(function(resolve, reject) {
          store.get(['balances', from], function(e, a) {
              if (e) { reject(e) } else if (a === {}) { resolve(0) } else { resolve(a) }
          });
      })
      var Pfound = new Promise(function(resolve, reject) {
          store.get(['contracts', json.for,json.contract], function(e, a) {
              if (e) { reject(e) } else if (a == {}) { resolve(0) } else { resolve(a) }
          });
      })
      Promise.all([Pbal,Pfound])
          .then(function(v) {
            var bal = v[0],found=v[1],type='steem',agent=found.auths[0][1][1].to
            if (found.amount && active && bal >= found.amount) {
                  if (found.sbd)type='sbd'
                  var PbalTo = new Promise(function(resolve, reject) {
                      store.get(['balances', agent], function(e, a) {
                          if (e) {reject(e)} else if (a == {}) { resolve(0) } else { resolve(a) }
                      });
                  })
                  var PbalFor = new Promise(function(resolve, reject) {
                      store.get(['balances', found.from], function(e, a) {
                          if (e) { reject(e) } else if (a == {}) { resolve(0) } else { resolve(a) }
                      });
                  })
                  var Pdex = new Promise(function(resolve, reject) {
                      store.get(['dex', type], function(e, a) {
                          if (e) { reject(e) } else if (a == {}) { resolve(0) } else { resolve(a) }
                      });
                  })
                  Promise.all([PbalTo,Pfound])
                      .then(function(v) {
                        var toBal = v[0],fromBal=v[1],dex=v[2]
                    if (toBal > found.amount) {
                        toBal -= found.amount
                        found.escrow = found.amount
                        bal -= found.amount
                        fromBal += found.amount
                        found.buyer = from
                        found.auths.pending = found.auths.shift()
                        var hisE = {
                            rate: found.rate,
                            block: json.block_num,
                            amount: found.amount
                        },
                        ops = []
                        if (found.steem) {
                            ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data:`@${from} purchased ${parseFloat(found.steem/1000).toFixed(3)} STEEM with ${parseFloat(found.amount/1000).toFixed(3)} DLUX via DEX`})
                            found.auths.push([agent,
                                [
                                    "transfer",
                                    {
                                        "from": agent,
                                        "to": from,
                                        "amount": (found.steem / 1000).toFixed(3) + ' STEEM',
                                        "memo": `${json.contract} by ${found.from} purchased with ${found.amount} DLUX`
                                    }
                                ]
                            ])
                        } else {
                            ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data:`@${from} purchased ${parseFloat(found.sbd/1000).toFixed(3)} SBD via DEX`})
                            found.auths.push([agent,
                                [
                                    "transfer",
                                    {
                                        "from": agent,
                                        "to": from,
                                        "amount": (found.sbd / 1000).toFixed(3) + ' SBD',
                                        "memo": `${json.contract} by ${found.from} fulfilled with ${found.amount} DLUX`
                                    }
                                ]
                            ])
                        }
                        store.batch([
                          ops[0],
                          {type:'put',path:['contracts', json.for,json.contract],data:found},
                          {type:'put',path:['escrow',forward[0][0]],data:forward[0][1]},
                          {type:'put',path:['balances', from],data:bal},
                          {type:'put',path:['balances', agent],data:balTo},
                          {type:'put',path:['balances', found.from],data:balFor},
                          {type:'put',path:['dex', type,'tick'],data:json.rate},
                          {type:'put',path:['dex', type,'his', `${hisE.block}:${json.contract}`],data:hisE},
                          {type:'del',path:['dex',type,'buyOrders',`${json.rate}:${json.contract}`]}
                        ])
                    } else {
                    ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data:`@${from} has insuficient liquidity to purchase ${found.txid}`})
                }
            })
          }
        })
    });

    processor.on('dex_steem_sell', function(json, from, active) {
        var buyAmount = parseInt(json.steem)
        store.get(['balances',from],function(e,a){
          if(!e){
            var b = a
            if (json.dlux <= b && typeof buyAmount == 'number' && active) {
                var txid = 'DLUX' + hashThis(from + json.block_num)
                const contract = {
                    txid,
                    type: 'ss',
                    from: from,
                    steem: buyAmount,
                    sbd: 0,
                    amount: parseInt(json.dlux),
                    rate: parseFloat((buyAmount) / (json.dlux)).toFixed(6),
                    block: json.block_num
                }
                chronAssign(json.block_num + 86400, {
                    block: parseInt(json.block_num + 86400),
                    op: 'expire',
                    from: from,
                    txid
                })
                store.batch([
                  {type:'put', path:['dex', 'steem', 'sellOrders', `${contract.rate}:${contract.txid}`], data: contract},
                  {type:'put', path:['balances', from], data: b-contract.amount},
                  {type:'put', path:['contracts', from, contract.txid], data: contract},
                  {type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data:`@${from} has placed order ${txid} to sell ${parseFloat(json.dlux/1000).toFixed(3)} for ${parseFloat(json.steem/1000).toFixed(3)} STEEM`}
                ])
            } else {
                store.batch([{type:'put', path:['feed', `${json.block_num}:${json.transaction_id}`], data:`@${from} tried to place an order to sell ${parseFloat(json.dlux/1000).toFixed(3)} for ${parseFloat(json.steem/1000).toFixed(3)} STEEM`}])
            }
          } else {
            console.log(e)
          }
        })
    });

    processor.on('dex_sbd_sell', function(json, from, active) {
        var buyAmount = parseInt(json.sbd)
        store.get(['balances',from],function(e,a){
          if(!e){
            var b = a
            if (json.dlux <= b && typeof buyAmount == 'number' && active) {
                var txid = 'DLUX' + hashThis(from + json.block_num)
                const contract = {
                    txid,
                    type:'ds',
                    from: from,
                    steem: 0,
                    sbd: buyAmount,
                    amount: json.dlux,
                    rate: parseFloat((buyAmount) / (json.dlux)).toFixed(6),
                    block: json.block_num
                }
                chronAssign(json.block_num + 86400, {
                    block: parseInt(json.block_num + 86400),
                    op: 'expire',
                    from: from,
                    txid
                })
                store.batch([
                  {type:'put', path:['dex', 'sbd', 'sellOrders', `${contract.rate}:${contract.txid}`], data: contract},
                  {type:'put', path:['balances', from], data: b-contract.amount},
                  {type:'put', path:['contracts', from, contract.txid], data: contract},
                  {type:'put', path:['feed', `${json.block_num}:${json.transaction_id}`], data:`@${from} has placed order ${txid} to sell ${parseFloat(json.dlux/1000).toFixed(3)} for ${parseFloat(json.sbd/1000).toFixed(3)} SBD`}
                ])
            } else {
                store.batch([{type:'put', path:['feed', `${json.block_num}:${json.transaction_id}`], data:`@${from} tried to place an order to sell ${parseFloat(json.dlux/1000).toFixed(3)} for ${parseFloat(json.sbd/1000).toFixed(3)} SBD`}])
            }
          } else {
            console.log(e)
          }
        })
    });

    processor.on('dex_clear', function(json, from, active) {
        if (active) {
          var q=[]
          if(typeof json.txid == 'string'){
            q.push(json.txid)
          } else {
            q=json.txid
          }
          for(i=0;i<q.length;i++){
            store.get(['contracts',from,q[i]],function(e,a){
              if(!e){
                var b = a
                switch (b.type) {
                  case 'ss':
                    store.get(['dex', 'steem','sellOrders',`${b.rate}:${b.txid}`], function(e, a) {
                        if (e) { console.log(e) } else if (a == {}) { console.log('Nothing here'+b.txid) } else {
                          release(from, b.txid)
                        }
                    });
                    break;
                  case 'ds':
                    store.get(['dex', 'sbd','sellOrders',`${b.rate}:${b.txid}`], function(e, a) {
                        if (e) { console.log(e) } else if (a == {}) { console.log('Nothing here'+b.txid) } else {
                          release(from, b.txid)
                        }
                    });
                    break;
                  case 'sb':
                    store.get(['dex', 'steem','buyOrders',`${b.rate}:${b.txid}`], function(e, a) {
                        if (e) { console.log(e) } else if (a == {}) { console.log('Nothing here'+b.txid) } else {
                          release(from, b.txid)
                        }
                    });
                    break;
                  case 'db':
                      store.get(['dex', 'sbd','buyOrders',`${b.rate}:${b.txid}`], function(e, a) {
                          if (e) { console.log(e) } else if (a == {}) { console.log('Nothing here'+b.txid) } else {
                            release(from, b.txid)
                          }
                      });
                    break;
                  default:

                }
              } else {
                console.log(e)
              }
            })
          }
        }
    })

    processor.onOperation('escrow_transfer', function(json) { //grab posts to reward
        var op, dextx, contract, isAgent, isDAgent, dextx, meta, done = 0,type='steem'
        try {
            dextx = JSON.parse(json.json_meta).dextx
            meta = JSON.parse(json.json_meta).contract
            seller = JSON.parse(json.json_meta).for
        } catch (e) {}
        var PfromBal = new Promise(function(resolve, reject) {
            store.get(['balances', json.from], function(e, a) {
                if (e) { reject(e) } else if (a == {}) { resolve(0) } else { resolve(a) }
            });
        })
        var PtoBal = new Promise(function(resolve, reject) {
            store.get(['balances', json.to], function(e, a) {
                if (e) { reject(e) } else if (a == {}) { resolve(0) } else { resolve(a) }
            });
        })
        var PtoNode = new Promise(function(resolve, reject) {
            store.get(['markets', node, json.to], function(e, a) {
                if (e) { reject(e) } else if (a == {}) { resolve(0) } else { resolve(a) }
            });
        })
        var PagentNode = new Promise(function(resolve, reject) {
            store.get(['markets', node, json.agent], function(e, a) {
                if (e) { reject(e) } else if (a == {}) { resolve(0) } else { resolve(a) }
            });
        })
        var Pcontract = new Promise(function(resolve, reject) {
            store.get(['contracts', seller, meta], function(e, a) {
                if (e) { reject(e) } else if (a == {}) { resolve(0) } else { resolve(a) }
            });
        })
        Promise.all([PfromBal,PtoBal,PtoNode,PagentNode,Pcontract]).then(function(v) {
          var fromBal = v[0],toBal = v[1], toNode = v[2], agentNode = v[3], contract = v[4]
              isAgent = toNode.escrow
              isDAgent = agentNode.escrow
              buy = contract.amount
              if (typeof buy == 'number' && isAgent && isDAgent) { //{txid, from: from, buying: buyAmount, amount: json.dlux, [json.dlux]:buyAmount, rate:parseFloat((json.dlux)/(buyAmount)).toFixed(6), block:current, partial: json.partial || true
                  const now = new Date()
                  const until = now.setHours(now.getHours() + 1)
                  const check = Date.parse(json.ratification_deadline)
                  if (contract.steem == parseInt(parseFloat(json.steem_amount) * 1000) && contract.sbd == parseInt(parseFloat(json.sbd_amount) * 1000) && check > until) {
                      if (toBal >= contract.amount) {
                          done = 1
                          toBal -= contract.amount // collateral withdraw of dlux
                          fromBal += contract.amount // collateral held and therefore instant purchase
                          contract.escrow = contract.amount
                          contract.buyer = json.from
                          contract.approvals = 0
                          var hisE = {
                              rate: contract.rate,
                              block: json.block_num,
                              amount: contract.amount
                          }
                          var samount
                          if (contract.steem) {
                              samount = `${parseFloat(contract.steem/1000).toFixed(3)} STEEM`
                          } else {
                              type = 'sbd'
                              samount = `${parseFloat(contract.sbd/1000).toFixed(3)} SBD`
                          }
                          contract.auths = [
                            [json.to,
                                [
                                    "escrow_dispute",
                                    {
                                        "from": json.from,
                                        "to": json.to,
                                        "agent": json.agent,
                                        "who": json.to,
                                        "escrow_id": json.escrow_id
                                    }
                                ]
                            ],
                            [json.agent,
                                [
                                    "escrow_release",
                                    {
                                        "from": json.from,
                                        "to": json.to,
                                        "agent": json.agent,
                                        "who": json.agent,
                                        "reciever": json.to,
                                        "escrow_id": json.escrow_id,
                                        "sbd_amount": {
                                            "amount": parseInt(parseFloat(json.sbd_amount) * 1000)
                                                .toFixed(0),
                                            "precision": 3,
                                            "nai": "@@000000013"
                                        },
                                        "steem_amount": {
                                            "amount": parseInt(parseFloat(json.steem_amount) * 1000)
                                                .toFixed(0),
                                            "precision": 3,
                                            "nai": "@@000000021"
                                        }
                                    }
                                ]
                            ],
                              [json.to,
                                [
                                    "transfer",
                                    {
                                        "from": json.to,
                                        "to": contract.from,
                                        "amount": samount,
                                        "memo": `${contract.txid} by ${contract.from} purchased with ${parseFloat(contract.amount/1000).toFixed(3)} DLUX`
                                    }
                                ]
                            ]
                          ]
                          var ops = [
                            {type:'put',path:['feed',`${json.block_num}:${json.transaction_id}`],data:`@${json.from} has bought ${meta}: ${parseFloat(contract.amount/1000).toFixed(3)} for ${samount}`},
                            {type:'put',path:['contracts', seller, meta], data: contract},
                            {type:'put',path:['escrow', contract.pending[0][0],contract.txid], data: contract.pending[0][1]},
                            {type:'put',path:['escrow', json.escrow_id, json.from], data: {'for':seller,'contract':meta}},
                            {type:'put',path:['balances', json.from], data:fromBal},
                            {type:'put',path:['balances', json.to], data:balTo},
                            {type:'put',path:['dex', type, 'tick'], data:contract.rate},
                            {type:'put',path:['chrono',`${json.block_num}`]},
                            {type:'put',path:['dex', type, 'his', `${hisE.block}:${found.txid}`],data:hisE},
                            {type:'del',path:['dex',type, 'sellOrders', `${contract.rate}:${contract.txid}`]}
                          ]
                          ops.push({type:'put',path:['escrow', json.to, contract.txid+':buyApprove'], data: [
                              "escrow_approve",
                              {
                                  "from": json.from,
                                  "to": json.to,
                                  "agent": json.agent,
                                  "who": json.to,
                                  "escrow_id": json.escrow_id,
                                  "approve": true
                              }
                          ]}),
                          ops.push({type:'put',path:['escrow', json.agent, contract.txid+':buyApprove'], data:[
                              "escrow_approve",
                              {
                                  "from": json.from,
                                  "to": json.to,
                                  "agent": json.agent,
                                  "who": json.agent,
                                  "escrow_id": json.escrow_id,
                                  "approve": true
                              }
                          ]})
                          store.batch(ops)
                        }
                  if (!done) {
                    var out = []
                    out.push({type:'put',path:['escrow',json.to, json.escrow_id],data:[
                        "escrow_approve",
                        {
                            "from": json.from,
                            "to": json.to,
                            "agent": json.agent,
                            "who": json.to,
                            "escrow_id": json.escrow_id,
                            "approve": false
                        }
                    ]})
                    out.push({type:'put',path:['escrow',json.agent, json.escrow_id],data:[
                        "escrow_approve",
                        {
                            "from": json.from,
                            "to": json.to,
                            "agent": json.agent,
                            "who": json.agent,
                            "escrow_id": json.escrow_id,
                            "approve": false
                        }
                    ]})
                    store.batch(out)
                  }
              }
            } else if (toBal > dextx.dlux && typeof dextx.dlux === 'number' && dextx.dlux > 0 && isAgent && isDAgent) {
              var txid = 'DLUX' + hashThis(`${json.from}${json.block_num}`),
                  ops = [
                    {type:'put',path:['escrow',json.agent, txid+':listApprove'],data:[
                        "escrow_approve",
                        {
                            "from": json.from,
                            "to": json.to,
                            "agent": json.agent,
                            "who": json.agent,
                            "escrow_id": json.escrow_id,
                            "approve": false
                        }
                    ]},
                    {type:'put',path:['escrow',json.to, txid+':listApprove'],data:[
                        "escrow_approve",
                        {
                            "from": json.from,
                            "to": json.to,
                            "agent": json.agent,
                            "who": json.to,
                            "escrow_id": json.escrow_id,
                            "approve": true
                        }
                    ]},
                    {type:'put',path:['escrow',json.escrow_id,json.from],data:{'for':json.from,contract:txid}}
                  ],
              auths = [
                  [json.to,
                      [
                          "escrow_dispute",
                          {
                              "from": json.from,
                              "to": json.to,
                              "agent": json.agent,
                              "who": json.to,
                              "escrow_id": json.escrow_id
                          }
                      ]
                  ],
                  [json.agent,
                      [
                          "escrow_release",
                          {
                              "from": json.from,
                              "to": json.to,
                              "agent": json.agent,
                              "who": json.agent,
                              "reciever": json.to,
                              "escrow_id": json.escrow_id,
                              "sbd_amount": json.sbd_amount,
                              "steem_amount": json.steem_amount
                          }
                      ]
                  ]
              ],
              reject = [json.to,
                  [
                      "escrow_release",
                      {
                          "from": json.from,
                          "to": json.to,
                          "agent": json.agent,
                          "who": json.to,
                          "escrow_id": json.escrow_id,
                          "sbd_amount": json.sbd_amount,
                          "steem_amount": json.steem_amount
                      }
                  ]
              ],
              contract = {
                  txid,
                  from: json.from,
                  steem: parseInt(parseFloat(json.steem_amount) * 1000),
                  sbd: parseInt(parseFloat(json.sbd_amount) * 1000),
                  amount: dextx.dlux,
                  rate: parseFloat(parseInt(parseFloat(json.steem_amount) * 1000) / dextx.dlux)
                      .toFixed(6),
                  block: json.block_num,
                  escrow_id: json.escrow_id,
                  agent: json.agent,
                  fee: json.fee.amount,
                  approvals: 0,
                  auths,
                  reject
              }
              chronAssign(json.block_num + 86400, {
                  block: parseInt(json.block_num + 86400),
                  op: 'expire',
                  from: from,
                  txid
              })
              if (parseFloat(json.steem_amount) > 0) {
                contract.type = 'sb'
                ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data: `@${json.from} signed a ${parseFloat(json.steem_amount).toFixed(3)} STEEM buy order for ${parseFloat(dextx.dlux).toFixed(3)} DLUX:${txid}`})
                ops.push({type:'put',path:['dex', 'steem', 'buyOrders',`${contract.rate}:${contract.txid}`],contract})
              } else if (parseFloat(json.sbd_amount) > 0) {
                contract.type = 'db'
                ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data: `@${json.from} signed a ${parseFloat(json.sbd_amount).toFixed(3)} STEEM buy order for ${parseFloat(dextx.dlux).toFixed(3)} DLUX:${txid}`})
                ops.push({type:'put',path:['dex', 'sbd', 'buyOrders',`${contract.rate}:${contract.txid}`],contract})
              }
              ops.push({type:'put',path:['contracts', json.from, txid],contract})
              store.batch(ops)
            } else if (isDAgent && isAgent) {
              var ops=[]
              ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`],data: `@${json.from} improperly attempted to use the escrow network. Attempting escrow deny.`})
              ops.push({type:'put',path:['escrow',json.agent, `deny${json.from}:${json.escrow_id}`],data:[
                        "escrow_approve",
                        {
                            "from": json.from,
                            "to": json.to,
                            "agent": json.agent,
                            "who": json.agent,
                            "escrow_id": json.escrow_id,
                            "approve": false //reject non coded
                        }
                    ]})
              store.batch(ops)
            }
        }).catch(function(e){console.log(e)})
    });

    processor.onOperation('escrow_approve', function(json) {
      store.get(['contracts',json.escrow_id,json.from],function(e,a){ // since escrow ids are unique to sender, store a list of pointers to the owner of the contract
        if(!e){
              store.get(['contracts', a.for, a.contract],function(e,b){
                if(e){console.log(e1)}
                  var c = b
                  var dataOps = [
                    {type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data: `:@${json.who} approved escrow for ${json.from}`}
                  ]
                  if (json.approve){
                    c.approvals++
                    if(c.buyer){
                      if(c.approvals==2){c.pending = c.auth.shift()
                        dataOps.push({type:'put',path:['escrow'.c.pending[0],c.txid+':dispute'],data:c.pending[1]})
                      }
                      dataOps.push({type:'del',path:['escrow',json.who,c.txid+':buyApprove']})
                    } else {
                      dataOps.push({type:'del',path:['escrow',json.who,c.txid+'listApprove']})
                    }
                    dataOps.push({type:'put',path:['contracts',a[i].for,a[i].contract],data:c})
                    store.batch(dataOps)
                    credit(json.who)
                } else {
                  if (c.pending[1].approve == false){
                    dataOps.push({type:'del',path:['contracts', a.for, a.contract]})
                    dataOps.push({type:'del',path:['escrow',json.who,`deny${json.from}:${json.escrow_id}`]})
                    store.batch(dataOps)
                    credit(json.who)
                  }

                }
              })
          } else {console.log(e)}
      })
    });

    processor.onOperation('escrow_dispute', function(json) {
      store.get(['contracts',json.escrow_id,json.from],function(e,a){ // since escrow ids are unique to sender, store a list of pointers to the owner of the contract
        if(!e){
              store.get(['contracts', a.for, a.contract],function(e,b){
                if(e){console.log(e1)} else {
                  var c = b
                  c.pending = c.auth.shift()
                  store.batch([
                    {type:'put',path:['escrow'.c.pending[0],c.txid+':release'],data:c.pending[1]},
                    {type:'put',path:['contracts',a[i].for,a[i].contract],data:c},
                    {type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`],data: `@${json.who} authorized ${json.agent} for ${c.txid}`},
                    {type:'del',path:['escrow',json.who,c.txid+`:dispute`]}
                  ])
                  credit(json.who)
                }
              })
          } else {console.log(e)}
      })
    });

    processor.onOperation('escrow_release', function(json) {
        store.get(['contracts',json.escrow_id,json.from],function(e,a){ // since escrow ids are unique to sender, store a list of pointers to the owner of the contract
          if(!e){
                store.get(['contracts', a.for, a.contract],function(e,b){
                  if(e){console.log(e1)} else {
                    var c = b
                    c.pending = c.auth.shift()
                    store.batch([
                      {type:'put',path:['escrow'.c.pending[0],c.txid+':transfer'],data:c.pending[1]},
                      {type:'put',path:['contracts',a[i].for,a[i].contract],data:c},
                      {type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`],data:`@${json.who} released funds for @${owner}/${found}`},
                      {type:'del',path:['escrow',json.who,c.txid+`:release`]}
                    ])
                    credit(json.who)
                  }
                })
            } else {console.log(e)}
        })
    });

    processor.on('node_add', function(json, from, active) {
        if (json.domain && typeof json.domain === 'string') {
            var z = false
            if (json.escrow == true) {
                z = true
            }
            var int = parseInt(json.bidRate) || 0
            if (int < 1) {
                int = 1000
            }
            if (int > 1000) {
                int = 1000
            }
            var t = parseInt(json.marketingRate) || 0
            if (t < 1) {
                int = 2000
            }
            if (t > 2000) {
                int = 2000
            }
            store.get(['markets','node',from],function(e,a){
              if(!e){
                if(a==={}){
                  store.batch([{type:'put',path:['markets','node',from], data:{
                      domain: json.domain,
                      self: from,
                      bidRate: int,
                      marketingRate: t,
                      attempts: 0,
                      yays: 0,
                      wins: 0,
                      contracts: 0,
                      escrows: 0,
                      lastGood: 0,
                      report: {},
                      escrow: z
                  }}])
                } else {
                  var b = a;
                  b.domain = json.domain
                  b.bidRate = int
                  b.escrow = z
                  b.marketingRate = t
                  store.batch([{type:'put',path:['markets','node',from], data:b}])
                }
              } else {
                console.log(e)
              }
            })
            store.batch([{type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data:`@${from} has bid the steem-state node ${json.domain} at ${json.bidRate}`}])
        } else {
            store.batch([{type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data:`@${from} sent and invalid steem-state node operation`}])
        }
    });

    processor.on('node_delete', function(json, from, active) {
        if (active) {
          var ops = []
          var Pqueue = new Promise(function(resolve, reject) {
              store.get(['queue'], function(err, obj) {
                  if (err) {
                      reject(err)
                  } else {
                      resolve(obj)
                  }
              });
          });
          var Pnode = new Promise(function(resolve, reject) {
              store.get(['markets','node',from], function(err, obj) {
                  if (err) {
                      reject(err)
                  } else {
                      resolve(obj)
                  }
              });
          });
          Promise.all([Pqueue, Pnode, Prunners]).then(function(v) {
            var q = v[0],n=v[1],r=v[2]
            if(typeof n.bidRate=='number'){
              for (var i = 0; i < q.length; i++) {
                  if (qe[i] == from) {
                      found = i
                      break;
                  }
              }
              if (found >= 0) {
                  q.splice(found, 1)
                  ops.push({type:'put',path:['queue'],data:q})
              }
              delete b.domain
              delete b.bidRate
              delete b.escrow
              delete b.marketingRate
              ops.push({type:'del',path:['runners',from]})
              ops.push({type:'put',path:['markets','node',from],data:b})
            }
            ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data:`@${from} has signed off their dlux node`})
            store.batch(ops)
          }).catch(function(e){console.log(e)})
        }
    });

    processor.on('report', function(json, from, active) {
        store.get(['markets','node',from],function(e,a){
          if(!e){
            var b = a
            if(from == b.self && b.domain){
              b.report = json
              store.get(['queue'],function(e1,c){
                if(!e1){
                  var q = c.length >= 0 ? c : [],f
                  for (var i = 0; i < q.length; i++) {
                      if (q[i] == from) {
                          f = i
                          break;
                      }
                  }
                  if (f >= 0) {
                      q.unshift(q.splice(f, 1)[0])
                  } else {
                      q.push(from)
                  }
                  var ops = [
                    {type:'put',path:['queue'],data:q},
                    {type:'put',path:['markets','node',from],data:b},
                    {type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`],data: `@${from} - report has been processed`}
                  ]
                  store.batch(ops)
                } else {
                  console.log(e1)
                }
              })
            } else {
              if (from === config.username && config.NODEDOMAIN) {
                  console.log(json.transaction_id + '|' + json.block_num + `:This node posted a spurious report and in now attempting to register`)
                  transactor.json(config.username, config.active, 'node_add', {
                      domain: config.NODEDOMAIN,
                      bidRate: config.bidRate,
                      escrow
                  }, function(err, result) {
                      if (err) {
                          console.error(err);
                      }
                  })
              } else if (from === config.username) {
                  console.log(json.transaction_id + '|' + json.block_num + `:This node has posted a spurious report\nPlease configure your DOAMAIN and BIDRATE env variables`)
              } else {
                  console.log(json.transaction_id + '|' + json.block_num + `:@${from} has posted a spurious report`)
              }
            }
          }
          else{console.log(e)}
        })
    });

    processor.on('queueForDaily', function(json, from, active) {
        if (from = 'dlux-io' && json.text && json.title) {
            store.batch([{type:'put',path:['postQueue', json.title],data: {
                text: json.text,
                title: json.title
            }}])
        }
    })

    processor.on('nomention', function(json, from, active) {
        if (typeof json.nomention == 'boolean') {
            store.get(['delegators', from], function(e, a) {
                var ops = []
                if (!e && json.nomention) {
                    ops.push({type:'put',path:['nomention', from],data: true})
                } else if (!e && !json.nomention) {
                    ops.push({type:'del',path:['nomention', from]})
                }
                store.batch(ops)
            })
        }
    })

    processor.onOperation('comment_options', function(json, from) { //grab posts to reward
        try {
            var filter = json.extensions[0][1].beneficiaries
        } catch (e) {
            return;
        }
        var ops = []
        for (var i = 0; i < filter.length; i++) {
            if (filter[i].account == 'dlux-io' && filter[i].weight > 999) {
                ops.push({type:'put',path:['posts',`${json.block_num}`, `${json.author}/${json.permlink}`], data:{
                    block: json.block_num,
                    author: json.author,
                    permlink: json.permlink,
                    title: json.title,
                    totalWeight: 1,
                    voters: []
                }})
                chronAssign(json.block_num + 300000, {
                    block: parseInt(json.block_num + 300000),
                    op: 'post_reward',
                    author: json.author,
                    permlink: json.permlink
                })
                ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data: `@${json.author}/${json.permlink} added to dlux rewardable content`})
                store.batch(ops)
                if (config.username == 'dlux-io') {
                    client.database.call('get_content', [json.author, json.permlink])
                        .then(result => {
                            var bytes = rtrades.checkNpin(JSON.parse(result.json_metadata)
                                .assets)
/*
                            bytes.then(function(value) {
                                store.get(['stats'], function(e, a) {
                                    ops.push({type:'put',path:['stats', 'totalBytes'], data: (a.totalBytes + value)})
                                    ops.push({type:'put',path:['stats', 'bytesToday'], data: (a.bytesToday + value)})
                                })
                            })
*/
                        }).catch(e=>{console.log(e)});
                }
            }
        }
    });
    processor.onOperation('vote', function(json) {
        if (json.voter == 'dlux-io') {
            store.get(['escrow', json.voter], function(e, a) {
                if (!e) {
                    for (b in a) {
                        if (a[b][1].permlink == json.permlink) {
                            store.batch([{type:'del',path:['escrow', json.voter, b]}])
                            break;
                        }
                    }
                } else {
                    console.log(e)
                }
            })
        }
    })

    processor.onOperation('transfer', function(json) {
        var found = 0
        store.get(['escrow',json.from],function(e,a){
          var ops =[]
          if(!e){
            var b = a
            for (i in b) {
                if (b[i][1].to == json.to && b[i][1].steem_amount == json.steem_amount && b[i][1].sbd_amount == json.sbd_amount) {
                    ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data: `@${json.from} sent @${json.to} ${json.steem_amount}/${json.sbd_amount} for ${json.memo.split(' ')[0]}`})
                    var escrow = b.splice(i, 1)
                    found = 1
                    const addr = escrow[1].memo.split(' ')[0]
                    const seller = escrow[1].memo.split(' ')[2]
                    store.get(['contracts',seller,addr,'escrow'],function(e1,c){
                      if(!e1){
                        d = typeof c != 'number' ? 0 : c
                        store.get(['balances',json.from],function(e2,f){
                          if(!e2){
                            g = typeof f != 'number' ? 0 : f
                            ops.push({type:'put',path:['balances', json.from],data: parseInt(g+d)})
                            ops.push({type:'del',path:['escrow', json.from, i+':transfer']})
                            ops.push({type:'del',path:['contracts',seller,addr]})
                            credit(json.from)
                            store.batch(ops)
                          } else {
                            console.log(e2)
                          }
                        })
                      } else {
                        console.log(e1)
                      }
                    })
                    break;
                }
            }
          } else {
            console.log(e)
          }
        })
        if (json.to == 'robotolux' && json.amount.split(' ')[1] == 'STEEM') {
            const amount = parseInt(parseFloat(json.amount) * 1000)
            var purchase
            var Pstats = new Promise(function(resolve, reject) {
                store.get(['stats'], function(err, obj) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(obj)
                    }
                });
            });
            var Pbal = new Promise(function(resolve, reject) {
                store.get(['balancces',from], function(err, obj) {
                    if (err) {
                        reject(err)
                    } else {
                      if(typeof obj != 'number'){
                        resolve(0)
                      } else {
                        resolve(obj)
                      }
                    }
                });
            });
            var Pinv = new Promise(function(resolve, reject) {
                store.get(['balances','ri'], function(err, obj) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(obj)
                    }
                });
            });
            Promise.all([Pstats, Pbal, Pinv]).then(function(v) {
              stats = v[0],b=v[1],i=v[2],ops=[]
              if (!stats.outOnBlock) {
                  purchase = parseInt(amount / stats.icoPrice * 1000)
                  if (purchase < i) {
                      i -= purchase
                      b += purchase
                      store.batch([{type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data:`@${json.from} bought ${parseFloat(purchase/1000).toFixed(3)} DLUX with ${parseFloat(amount/1000).toFixed(3)} STEEM`}])
                  } else {
                      b += i
                      const left = purchase - i
                      stats.outOnBlock = json.block_num
                      store.batch([
                        {type:'put',path:['ico',json.block_num,json.from],data:parseInt(amount * left / purchase)},
                        {type:'put',path:['balances',json.from],data:b},
                        {type:'put',path:['balances','ri'],data:i},
                        {type:'put',path:['stats'],data:stats},
                        {type:'put',path:['feed'],data:`@${json.from} bought ALL ${parseFloat(parseInt(purchase - left)).toFixed(3)} DLUX with ${parseFloat(parseInt(amount)/1000).toFixed(3)} STEEM. And bid in the over-auction`}
                      ])
                  }
              } else {
                store.batch([
                  {type:'put',path:['ico',json.block_num,json.from],data:parseInt(amount)},
                  {type:'put',path:['feed'],data:`@${json.from} bought ALL ${parseFloat(parseInt(purchase - left)).toFixed(3)} DLUX with ${parseFloat(parseInt(amount)/1000).toFixed(3)} STEEM. And bid in the over-auction`}
                ])
              }
            });
        }
    });

    processor.onOperation('delegate_vesting_shares', function(json) { //grab posts to reward
        var ops = []
        const vests = parseInt(parseFloat(json.vesting_shares) * 1000000)
        if (json.delegatee == 'dlux-io' && vests) {
            ops.push({type:'put',path:['delegators', json.delegator], data: vests})
            ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data: `@${json.delegator} has delegated ${vests} vests to @dlux-io`})
        } else if (json.delegatee == 'dlux-io' && !vests) {
            ops.push({type:'del',path:['delegators', json.delegator]})
            ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data: `@${json.delegator} has removed delegation to @dlux-io`})
        }
        store.batch(ops)
    });
    /*
    processor.onOperation('account_update', function(json, from) { //grab posts to reward
    Utils.upKey(json.account, json.memo_key)
    });
    */

    processor.onOperation('comment', function(json) { //grab posts to reward
        if (json.author == 'dlux-io') {
            store.get(['escrow', json.author], function(e, a) {
                if (!e) {
                  var ops = []
                    for (b in a) {
                        if (a[b][1].permlink == json.permlink && b == 'comment') {
                            ops.push({type:'del',path:['escrow', json.author, b]})
                            store.batch(ops)
                            break;
                        }
                    }
                } else {
                    console.log(e)
                }
            })
        }
    });

    processor.onBlock(function(num, block) {
        current = num

        //* // virtual ops
        chronoProcess = true
        store.someChildren(['chrono'], {
            gte: num,
            lte: num + 1
        }, function(e, a) {
            for (i = 0; i < a.length; i++) {
                store.get(['chrono', a[i]], function(e, b) {
                    switch (b.op) {
                        case 'expire':
                          release(b.from,b.txid)
                          break;
                        case 'power_down':
                            store.get(['balances', from], function(e, lb) {
                                store.get(['pow', 't'], function(er, tpow) {
                                    store.get(['pow', from], function(err, pow) {
                                        es = []
                                        if (e) es.push(e)
                                        if (er) es.push(er)
                                        if (err) es.push(err)
                                        if (es.length) {
                                            console.log({
                                                es
                                            })
                                        } else {
                                            lbal = typeof lb != 'number' ? 0 : lb
                                            pbal = typeof pow != 'number' ? 0 : pow
                                            if (amount < lbal && active) {
                                                ops.push({type:'put',path:['balances', from], data: lbal + b.amount})
                                                ops.push({type:'put',path:['pow', from], data:pbal - b.amount})
                                                ops.push({type:'put',path:['pow', 't'], data:tpow - b.amount})
                                                ops.push({type:'put',path:['feed', `${json.block_num}:${json.transaction_id}`], data:`@${b.by} powered down ${parseFloat(b.amount/1000).toFixed(3)} DLUX`})
                                                store.batch(ops)
                                            }
                                        }
                                    });
                                });
                            })
                            break;
                        case 'post_reward':
                            store.get(['posts',`${num}`, `${b.author}/${b.permlink}`], function(e, a) {
                                var w = 0
                                for (i in a.voters) {
                                    w += a.voters[i].weight
                                }
                                ops.push({type:'put',path:['br', `${b.author}/${b.permlink}`],data: {
                                    op: 'dao_content',
                                    post: b,
                                    totalWeight: w
                                }})
                                ops.push({type:'del',path:['posts',`${num}`, `${b.author}/${b.permlink}`]})
                                store.batch(ops)
                            })
                            console.log(current + `:${post.author}/${post.permlink} voting expired and queued for payout`)
                            break;
                        default:

                    }
                    store.batch({type:'del',path:['chrono', a[i]]})
                })
            }

        })
        //*
        if (num % 100 === 0 && !processor.isStreaming()) {
            client.database.getDynamicGlobalProperties()
                .then(function(result) {
                    console.log('At block', num, 'with', result.head_block_number - num, `left until real-time. DAO @ ${(num - 20000) % 30240}`)
                });
        }
        if (num % 100 === 5 && processor.isStreaming()) {
            check(num);
        }
        if (num % 100 === 50 && processor.isStreaming()) {
            report(num);
            broadcast = 2
        }
        if ((num - 20000) % 30240 === 0) { //time for daily magic
            dao(num)
        }
        if (num % 100 === 0 && processor.isStreaming()) {
            client.database.getAccounts([config.username])
                .then(function(result) {
                    var account = result[0]

                });
        }
        if (num % 100 === 0) {
            tally(num);
        }
        if (num % 100 === 1) {
            store.get([], function(err, obj) {
                const blockState = Buffer.from(JSON.stringify([num, obj]))
                ipfsSaveState(num, blockState)
            })
        }
        for (var p = 0; p < pa.length; p++) { //automate some tasks
            var r = eval(pa[p][1])
            if (r) {
                NodeOps.push([
                    [0, 0],
                    [pa[p][2], pa[p][3]]
                ])
            }
        }
        //*
        if (config.active && processor.isStreaming()) {
            store.get(['escrow', config.username], function(e, a) {
                if (!e) {
                    for (b in a) {
                        NodeOps.push([
                            [0, 0],
                            a[b][1]
                        ]);
                    }
                    var ops = []
                    for (i = 0; i < NodeOps.length; i++) {
                        if (NodeOps[i][0][1] == 0) {
                            ops.push(NodeOps[i][1])
                            NodeOps[i][0][0] = 1
                        } else if (NodeOps[i][0][0] < 100) {
                            NodeOps[i][0][0]++
                        }
                    }
                    if(ops.length){
                      console.log(ops)
                      steemClient.broadcast.send({
                            extensions: [],
                            operations: ops
                        },
                        wif, (err, result) => {
                            if (err) {
                              console.log(err)
                                for (q = 0; q < NodeOps.length; q++) {
                                    if (NodeOps[i][0][1] == 1) {
                                        NodeOps[i][0][1] = 0
                                    }
                                }
                            } else {
                                for (q = 0; q < NodeOps.length; q++) {
                                    if (NodeOps[i][0][0] = 1) {
                                        NodeOps[i][0][1] = 1
                                    }
                                }
                            }
                        });
                      }
                } else {
                    console.log(e)
                }
            })
        }
    });

    processor.onStreamingStart(function() {
        console.log("At real time.")
        store.get(['markets', 'node', config.username], function(e, a) {
            if (!a.domain && config.NODEDOMAIN) {
                transactor.json(config.username, config.active, 'node_add', {
                    domain: config.NODEDOMAIN,
                    bidRate: config.bidRate,
                    escrow
                }, function(err, result) {
                    if (err) {
                        console.error(err);
                    }
                })
            }
        })
    });

    processor.start();
}


function check() {
    plasma.markets = {
        nodes: {},
        ipfss: {},
        relays: {}
    }
    store.get(['stats'],function(e,s){
      store.get(['markets','node'],function(e,a){
        var b = a
        for (var account in b) {
            var self = b[account].self
            plasma.markets.nodes[self] = {
                self: self,
                agreement: false,
            }
            var domain = b[self] ? b[self].domain : 0
                if (domain && domain != config.NODEDOMAIN) {
                var domain = b[self].domain
                if (domain.slice(-1) == '/') {
                    domain = domain.substring(0, domain.length - 1)
                }
                fetch(`${domain}/stats`)
                    .then(function(response) {
                        //console.log(response)
                        return response.json();
                    })
                    .then(function(myJson) {
                        if (s.hashLastIBlock === myJson.stats.hashLastIBlock) {
                            plasma.markets.nodes[myJson.node].agreement = true
                        }
                    }).catch(e=>{})
            }
        }
    })
  })
}

function tally(num) {
  var Prunners = new Promise(function(resolve, reject) {
      store.get(['runners'], function(err, obj) {
          if (err) {
              reject(err)
          } else {
              resolve(obj)
          }
      });
  });
  var Pnode = new Promise(function(resolve, reject) {
      store.get(['markets','node'], function(err, obj) {
          if (err) {
              reject(err)
          } else {
              resolve(obj)
          }
      });
  });
  var Pstats = new Promise(function(resolve, reject) {
      store.get(['stats'], function(err, obj) {
          if (err) {
              reject(err)
          } else {
              resolve(obj)
          }
      });
  });
  var Prb = new Promise(function(resolve, reject) {
      store.get(['balances','ra'], function(err, obj) {
          if (err) {
              reject(err)
          } else {
              resolve(obj)
          }
      });
  });
  Promise.all([Prunners, Pnode, Pstats,Prb]).then(function(v) {
  var runners = v[0], nodes = v[1], stats = v[2], rbal = v[3]
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
  for (var node in runners) {
      tally.agreements.runners[node] = nodes[node]
      var getHash
      try{getHash=nodes[node].report.hash}catch(e){}
      tally.agreements.tally[node] = {
          self: node,
          hash: getHash,
          votes: 0
      } //build a dataset to count
  }
  for (var node in tally.agreements.runners) {
    var ags
    try{ags=tally.agreements.runners[node].report.agreements}catch(e){}
      for (var subnode in ags) {
          if (tally.agreements.tally[subnode]) {
              if (tally.agreements.tally[subnode].hash == tally.agreements.tally[node].hash) {
                  tally.agreements.tally[subnode].votes++
              }
          }
      }
      tally.agreements.votes++
  }
  var l = 0
  var consensus
  for (var node in runners) {
      l++
      var forblock = 0
      try{ forblock = nodes[node].report.block}catch(e){}
      if (tally.agreements.tally[node].votes / tally.agreements.votes >= 2 / 3 && nodes[node].report.block > num - 100) {
          consensus = tally.agreements.runners[node].report.hash
      } else if (l > 1 && forblock > num - 100) {
          delete runners[node]
          console.log('uh-oh:' + node + ' scored ' + tally.agreements.tally[node].votes + '/' + tally.agreements.votes)
      } else if (l == 1 && forblock > num - 100) {
          if (nodes[node].report.block > num - 100) consensus = nodes[node].report.hash
      }
      if (consensus === undefined) {
          for (var node in runners) {
              if (forblock > num - 100) {
                  consensus = nodes[node].report.hash
              } else {}
              break;
          }
      }
  }
  console.log('Consensus: ' + consensus)
  stats.lastBlock = stats.hashLastIBlock
  if (consensus) stats.hashLastIBlock = consensus
  for (var node in nodes) {
      nodes[node].attempts++
      var getHash
      try{getHash=nodes[node].report.hash}catch(e){}
      if (getHash == stats.hashLastIBlock) {
          nodes[node].yays++
          nodes[node].lastGood = num
      }
  }
  if (l < 20) {
      for (var node in nodes) {
          tally.election[node] = nodes[node]
      }
      tally.results = []
      for (var node in runners) {
          delete tally.election[node]
      }
      for (var node in tally.election) {
        var getHash
        try{getHash=nodes[node].report.hash}catch(e){}
          if (getHash !== stats.hashLastIBlock && stats.hashLastIBlock) {
              delete tally.election[node]
          }
      }
      var t = 0
      for (var node in tally.election) {
          t++
          tally.results.push([node, parseInt(((tally.election[node].yays / tally.election[node].attempts) * tally.election[node].attempts))])
      }
      if (t) {
          tally.results.sort(function(a, b) {
              return a[1] - b[1];
          })
          tally.winner = tally.results.pop()
          runners[tally.winner[0]] = {
              self: nodes[tally.winner[0]].self,
              domain: nodes[tally.winner[0]].domain
          }
      }
  }
  for (var node in runners) {
      nodes[node].wins++
  }
  //count agreements and make the runners list, update market rate for node services
  if (num > 30900000) {
      var mint = parseInt(stats.tokenSupply / stats.interestRate)
      stats.tokenSupply += mint
      rbal += mint
  }
  store.batch([
    {type:'put', path:['stats'], data:stats},
    {type:'put', path:['runners'], data:runners},
    {type:'put', path:['markets','node'], data:nodes},
    {type:'put', path:['balances','ra'], data:rbal}])
  if (consensus && consensus != plasma.hashLastIBlock && processor.isStreaming()) {
      //exit(consensus)
      var errors = ['failed Consensus']
      if (VERSION != nodes[node].report.version) {
          console.log(current + `:Abandoning ${plasma.hashLastIBlock} because ${errors[0]}`)
      }
      //const blockState = Buffer.from(JSON.stringify([num, state]))
      plasma.hashBlock = ''
      plasma.hashLastIBlock = ''
      console.log(current + `:Abandoning ${plasma.hashLastIBlock} because ${errors[0]}`)
  }
});
}

function release(from,txid) {
    var found = ''
    store.get(['contracts', from, txid],function(er,a){
      if(er) {console.log(er)} else {
        var ops = []
        switch (a.type) {
          case 'ss':
            store.get(['dex', 'steem','sellOrders',`${a.rate}:${a.txid}`], function(e, r) {
                if (e) { console.log(e) } else if (r == {}) { console.log('Nothing here'+a.txid) } else {
                  add(r.from,r.amount)
                  ops.push({type:'del',path:['contracts', from, txid]})
                  ops.push({type:'del',path:['dex', 'steem','sellOrders',`${a.rate}:${a.txid}`]})
                  store.batch(ops)
                }
            });
            break;
          case 'ds':
            store.get(['dex', 'sbd','sellOrders',`${a.rate}:${a.txid}`], function(e, r) {
                if (e) { console.log(e) } else if (r == {}) { console.log('Nothing here'+a.txid) } else {
                  add(r.from,r.amount)
                  ops.push({type:'del',path:['contracts', from, txid]})
                  ops.push({type:'del',path:['dex', 'sbd','sellOrders',`${a.rate}:${a.txid}`]})
                  store.batch(ops)
                }
            });
            break;
          case 'sb':
            store.get(['dex', 'steem','buyOrders',`${a.rate}:${a.txid}`], function(e, r) {
                if (e) { console.log(e) } else if (r == {}) { console.log('Nothing here'+a.txid) } else {
                  ops.push({type:'put',path:['contract', from, txid, 'pending'],data:r.reject[0]})
                  ops.push({type:'put',path:['escrow', r.reject[0][0],r.txid],data:r.reject[0][1]})
                  ops.push({type:'del',path:['dex', 'steem','buyOrders',`${a.rate}:${a.txid}`]})
                  store.batch(ops)
                }
            });
            break;
          case 'db':
              store.get(['dex', 'sbd','buyOrders',`${a.rate}:${a.txid}`], function(e, r) {
                  if (e) { console.log(e) } else if (r == {}) { console.log('Nothing here'+a.txid) } else {
                    ops.push({type:'put',path:['contract', from, txid, 'pending'],data:r.reject[0]})
                    ops.push({type:'put',path:['escrow', r.reject[0][0],r.txid],data:r.reject[0][1]})
                    ops.push({type:'del',path:['dex', 'sbd','buyOrders',`${a.rate}:${a.txid}`]})
                    store.batch(ops)
                  }
              });
            break;
          default:
        }
      }
    })
}

function dao(num) {
    var post = `## DLUX DAO REPORT\n`,
        news = '',
        daops = []
    var Pnews = new Promise(function(resolve, reject) {
            store.get(['postQueue'], function(err, obj) {
                if (err) {
                  reject(err)
                } else {
                  var news = obj !== {} ? '*****\n### News from Humans!\n' : ''
                  for (var title in obj) { //postQueue[title].{title,text}
                      news = news + `#### ${title}\n`
                      news = news + `${obj[title].text}\n\n`
                  }
                  resolve(news)
                }
            });
        });
    var Pbals = new Promise(function(resolve, reject) { //put back
            store.get(['balances'], function(err, obj) {
                if (err) {
                    reject(err)
                } else {
                    resolve(obj)
                }
            });
        });
    var Prunners = new Promise(function(resolve, reject) {
            store.get(['runners'], function(err, obj) {
                if (err) {
                    reject(err)
                } else {
                    resolve(obj)
                }
            });
        });
    var Pnodes = new Promise(function(resolve, reject) { //put back
            store.get(['markets','node'], function(err, obj) {
                if (err) {
                    reject(err)
                } else {
                    resolve(obj)
                }
            });
        });
    var Pstats = new Promise(function(resolve, reject) { //put back
            store.get(['stats'], function(err, obj) {
                if (err) {
                    reject(err)
                } else {
                    resolve(obj)
                }
            });
        });
    var Pdelegations = new Promise(function(resolve, reject) { //put back
            store.get(['delegations'], function(err, obj) {
                if (err) {
                    reject(err)
                } else {
                    resolve(obj)
                }
            });
        });
    var Pico = new Promise(function(resolve, reject) { //put back
            store.get(['ico'], function(err, obj) {
                if (err) {
                    reject(err)
                } else {
                    resolve(obj)
                }
            });
        });
    var Pdex = new Promise(function(resolve, reject) { //put back
            store.get(['dex'], function(err, obj) {
                if (err) {
                    reject(err)
                } else {
                    resolve(obj)
                }
            });
        });
    var Pbr = new Promise(function(resolve, reject) { //put back
            store.get(['br'], function(err, obj) {
                if (err) {
                    reject(err)
                } else {
                    resolve(obj)
                }
            });
        });
    var Ppbal = new Promise(function(resolve, reject) { //put back
            store.get(['pow','t'], function(err, obj) {
                if (err) {
                    reject(err)
                } else {
                    resolve(obj)
                }
            });
        });
    var Pnomen = new Promise(function(resolve, reject) { //put back
            store.get(['nomention'], function(err, obj) {
                if (err) {
                    reject(err)
                } else {
                    resolve(obj)
                }
            });
        });
    var Pposts = new Promise(function(resolve, reject) { //put back
            store.get(['posts'], function(err, obj) {
                if (err) {
                    reject(err)
                } else {
                    resolve(obj)
                }
            });
        });
    Promise.all([Pnews,Pbals,Prunners,Pnodes,Pstats,Pdelegations,Pico,Pdex,Pbr,Ppbal,Pnomen,Pposts]).then(function(v) {
      daops.push({type:'del',path:['postQueue']})
      daops.push({type:'del',path:['br']})
      daops.push({type:'del',path:['rolling']})
      daops.push({type:'del',path:['ico']})
      news = v[0] + '*****\n'
      const header = post + news
      var bals = v[1],
          runners = v[2],
          mnode = v[3],
          stats = v[4],
          deles = v[5],
          ico = v[6],
          dex = v[7],
          br = v[8],
          powBal = v[9],
          nomention = v[10],
          cpost = v[11]

      var i = 0,
          j = 0,
          b = 0,
          t = 0
      t = parseInt(bals.ra)
      for (var node in runners) { //node rate
          b = parseInt(b) + parseInt(mnode[node].marketingRate) || 2500
          j = parseInt(j) + parseInt(mnode[node].bidRate) || 2500
          i++
          console.log(b, j, i)
      }
      if (!i) {
          b = mnode['dlux-io'].marketingRate
          j = mnode['dlux-io'].bidRate
          i++
      }
      stats.marketingRate = parseInt(b / i)
      stats.nodeRate = parseInt(j / i)
      post = `![The Hyper Cube](https://ipfs.busy.org/ipfs/QmRtFirFM3f3Lp7Y22KtfsS2qugULYXTBnpnyh8AHzJa7e)\n#### Daily Accounting\n`
      post = post + `Total Supply: ${parseFloat(parseInt(stats.tokenSupply)/1000).toFixed(3)} DLUX\n* ${parseFloat(parseInt(stats.tokenSupply-powBal-(bals.ra +bals.rb +bals.rc +bals.rd +bals.re +bals.ri +bals.rr +bals.rn+bals.rm))/1000).toFixed(3)} DLUX liquid\n`
      post = post + `* ${parseFloat(parseInt(powBal)/1000).toFixed(3)} DLUX Powered up for Voting\n`
      post = post + `* ${parseFloat(parseInt(bals.ra +bals.rb +bals.rc +bals.rd +bals.re +bals.ri +bals.rr +bals.rn+bals.rm)/1000).toFixed(3)} DLUX in distribution accounts\n`
      post = post + `${parseFloat(parseInt(t)/1000).toFixed(3)} DLUX has been generated today. 5% APY.\n${parseFloat(stats.marketingRate/10000).toFixed(4)} is the marketing rate.\n${parseFloat(stats.nodeRate/10000).toFixed(4)} is the node rate.\n`
      console.log(`DAO Accounting In Progress:\n${t} has been generated today\n${stats.marketingRate} is the marketing rate.\n${stats.nodeRate} is the node rate.`)
      bals.rn += parseInt(t * parseInt(stats.nodeRate) / 10000)
      bals.ra = parseInt(bals.ra) - parseInt(t * parseInt(stats.nodeRate) / 10000)
      bals.rm += parseInt(t * stats.marketingRate / 10000)
      post = post + `${parseFloat(parseInt(t * stats.marketingRate / 10000)/1000).toFixed(3)} DLUX moved to Marketing Allocation.\n`
      if (bals.rm > 1000000000) {
          bals.rc += bals.rm - 1000000000;
          post = post + `${parseFloat((bals.rm - 1000000000)/1000).toFixed(3)} moved from Marketing Allocation to Content Allocation due to Marketing Holdings Cap of 1,000,000.000 DLUX\n`
          bals.rm = 1000000000
      }
      bals.ra = parseInt(bals.ra) - parseInt(t * stats.marketingRate / 10000)

      i = 0, j = 0
      post = post + `${parseFloat(parseInt(bals.rm)/1000).toFixed(3)} DLUX is in the Marketing Allocation.\n##### Node Rewards for Elected Reports and Escrow Transfers\n`
      console.log(num + `:${bals.rm} is availible in the marketing account\n${bals.rn} DLUX set asside to distribute to nodes`)
      for (var node in mnode) { //tally the wins
          j = j + parseInt(mnode[node].wins)
      }
      b = bals.rn

      function _atfun(node) {
          if (nomention[node]) {
              return '@_'
          } else {
              return '@'
          }
      }
      for (var node in mnode) { //and pay them
          i = parseInt(mnode[node].wins / j * b)
          if (bals[node]) {
              bals[node] += i
          } else {
              bals[node] = i
          }
          bals.rn -= i
          const _at = _atfun(node)
          post = post + `* ${_at}${node} awarded ${parseFloat(i/1000).toFixed(3)} DLUX for ${mnode[node].wins} credited transaction(s)\n`
          console.log(current + `:@${node} awarded ${i} DLUX for ${mnode[node].wins} credited transaction(s)`)
          mnode[node].wins = 0
      }
      bals.rd += parseInt(t * stats.delegationRate / 10000) // 10% to delegators
      post = post + `### ${parseFloat(parseInt(bals.rd)/1000).toFixed(3)} DLUX set aside for [@dlux-io delegators](https://app.steemconnect.com/sign/delegate-vesting-shares?delegatee=dlux-io&vesting_shares=100%20SP)\n`
      bals.ra -= parseInt(t * stats.delegationRate / 10000)
      b = bals.rd
      j = 0
      console.log(current + `:${b} DLUX to distribute to delegators`)
      for (i in deles) { //count vests
          j += deles[i]
      }
      for (i in deles) { //reward vests
          k = parseInt(b * deles[i] / j)
          if (bals[i] === undefined) {
              bals[i] = 0
          }
          bals[i] += k
          bals.rd -= k
          const _at = _atfun(node)
          post = post + `* ${parseFloat(parseInt(k)/1000).toFixed(3)} DLUX for ${_at}${i}'s ${parseFloat(deles[i]/1000000).toFixed(1)} Mvests.\n`
          console.log(current + `:${k} DLUX awarded to ${i} for ${deles[i]} VESTS`)
      }
      post = post + `*****\n ## ICO Status\n`
      if (bals.ri < 100000000 && stats.tokenSupply < 100000000000) {
          if (bals.ri == 0) {
              stats.tokenSupply += 100000000
              bals.ri = 100000000
              var ago = num - stats.outOnBlock,
                  dil = ' seconds'
              if (ago !== num) {
                  bals.rl = parseInt(ago / 30240 * 50000000)
                  bals.ri = 100000000 - parseInt(ago / 30240 * 50000000)
                  stats.icoPrice = stats.icoPrice * (1 + (ago / 30240) / 2)
              }
              if (ago > 20) {
                  dil = ' minutes';
                  ago = parseFloat(ago / 20)
                      .toFixed(1)
              } else {
                  ago = ago * 3
              }
              if (ago > 60) {
                  dil = ' hours';
                  ago = parseFloat(ago / 60)
                      .toFixed(1)
              }
              post = post + `### We sold out ${ago}${dil}\nThere are now ${parseFloat(bals.ri/1000).toFixed(3)} DLUX for sale from @robotolux for ${parseFloat(stats.icoPrice/1000).toFixed(3)} Steem each.\n`
          } else {
              var left = bals.ri
              stats.tokenSupply += 100000000 - left
              bals.ri = 100000000
              stats.icoPrice = stats.icoPrice - (left / 1000000000)
              if (stats.icoPrice < 220) stats.icoPrice = 220
              post = post + `### We Sold out ${100000000 - left} today.\nThere are now ${parseFloat(bals.ri/1000).toFixed(3)} DLUX for sale from @robotolux for ${parseFloat(stats.icoPrice/1000).toFixed(3)} Steem each.\n`
          }
      } else {
          post = post + `### We have ${parseFloat(parseInt(bals.ri - 100000000)/1000).toFixed(3)} DLUX left for sale at 0.22 STEEM in our Pre-ICO.\nOnce this is sold pricing feedback on our 3 year ICO starts.[Buy ${parseFloat(10/(parseInt(stats.icoPrice)/1000)).toFixed(3)} DLUX* with 10 Steem now!](https://app.steemconnect.com/sign/transfer?to=robotolux&amount=10.000%20STEEM)\n`
      }
      if (bals.rl) {
          var dailyICODistrobution = bals.rl,
              y = 0
          for (i = 0; i <ico.length; i++) {
              for (var node in ico[i]) {
                  y +=ico[i][node]
              }
          }
          post = post + `### ICO Over Auction Results:\n${parseFloat(bals.rl/1000).toFixed(3)} DLUX was set aside from today's ICO to divide between people who didn't get a chance at fixed price tokens and donated ${parseFloat(y/1000).toFixed(3)} STEEM today.\n`
          for (i = 0; i <ico.length; i++) {
              for (var node in ico[i]) {
                  if (!bals[node]) {
                      bals[node] = 0
                  }
                  bals[node] += parseInt(ico[i][node] / y * bals.rl)
                  dailyICODistrobution -= parseInt(ico[i][node] / y * bals.rl)
                  post = post + `* @${node} awarded  ${parseFloat(parseInt(ico[i][node]/y*bals.rl)/1000).toFixed(3)} DLUX for ICO auction\n`
                  console.log(current + `:${node} awarded  ${parseInt(ico[i][node]/y*bals.rl)} DLUX for ICO auction`)
                  if (i ==ico.length - 1) {
                      bals[node] += dailyICODistrobution
                      post = post + `* @${node} awarded  ${parseFloat(parseInt(dailyICODistrobution)/1000).toFixed(3)} DLUX for ICO auction\n`
                      console.log(current + `:${node} given  ${dailyICODistrobution} remainder`)
                  }
              }
          }
          bals.rl = 0
         ico = []
      }
      var vol = 0,
          volsbd = 0,
          vols = 0,
          his = [],
          hisb = [],
          hi = {},
          len = dex.steem.his ? dex.steem.his.length : 0,
          lenb = dex.sbd.his ? dex.sbd.his.length : 0
      for (var int = 0; int < len; int++) {
          if (dex.steem.his[int].block < num - 30240) {
              his.push(dex.steem.his.splice(int, 1))
          } else {
              vol = parseInt(parseInt(dex.steem.his[int].amount) + vol)
              vols = parseInt(parseInt(parseInt(dex.steem.his[int].amount) * parseFloat(dex.steem.his[int].rate)) + vols)
          }
      }
      for (var int = 0; int < lenb; int++) {
          if (dex.sbd.his[int].block < num - 30240) {
              hisb.push(dex.sbd.his.splice(int, 1))
          } else {
              vol = parseInt(parseInt(dex.sbd.his[int].amount) + vol)
              volsbd = parseInt(parseInt(parseInt(dex.sbd.his[int].amount) * parseFloat(dex.sbd.his[int].rate)) + volsbd)
          }
      }
      if (his.length) {
          hi.block = num - 60480
          hi.open = parseFloat(his[0].rate)
          hi.close = parseFloat(his[his.length - 1].rate)
          hi.top = hi.open
          hi.bottom = hi.open
          hi.vol = 0
          for (var int = 0; int < his.length; int++) {
              if (hi.top < parseFloat(his[int])) {
                  hi.top = parseFloat(his[int].rate)
              }
              if (hi.bottom > parseFloat(his[int])) {
                  hi.bottom = parseFloat(his[int].rate)
              }
              hi.vol = parseInt(hi.vol + parseInt(his[int].amount))
          }
          dex.steem.days.push(hi)
      }
      if (hisb.length) {
          hi.open = parseFloat(hisb[0].rate)
          hi.close = parseFloat(hisb[hisb.length - 1].rate)
          hi.top = hi.open
          hi.bottom = hi.open
          hi.vol = 0
          for (var int = 0; int < hisb.length; int++) {
              if (hi.top < parseFloat(hisb[int])) {
                  hi.top = parseFloat(hisb[int].rate)
              }
              if (hi.bottom > parseFloat(hisb[int])) {
                  hi.bottom = parseFloat(hisb[int].rate)
              }
              hi.vol = parseInt(hi.vol + parseInt(hisb[int].amount))
          }
          dex.sbd.days.push(hi)
      }
      post = post + `*****\n### DEX Report\n#### Spot Information\n* Price: ${parseFloat(dex.steem.tick).toFixed(3)} STEEM per DLUX\n* Price: ${parseFloat(dex.sbd.tick).toFixed(3)} SBD per DLUX\n#### Daily Volume:\n* ${parseFloat(vol/1000).toFixed(3)} DLUX\n* ${parseFloat(vols/1000).toFixed(3)} STEEM\n* ${parseFloat(parseInt(volsbd)/1000).toFixed(3)} SBD\n*****\n`
      bals.rc = bals.rc + bals.ra
      bals.ra = 0
      var q = 0,
          r = bals.rc
      for (var i = 0; i < br.length; i++) {
          q += br[i].totalWeight
      }
      var contentRewards = ``
      if (br.length) contentRewards = `#### Top Paid Posts\n`
      const compa = bals.rc
      for (var i = 0; i < br.length; i++) {
          for (var j = 0; j < br[i].post.voters.length; j++) {
              bals[br[i].post.author] += parseInt(br[i].post.voters[j].weight * 2 / q * 3)
              bals.rc -= parseInt(br[i].post.voters[j].weight / q * 3)
              bals[br[i].post.voters[j].from] += parseInt(br[i].post.voters[j].weight / q * 3)
              bals.rc -= parseInt(br[i].post.voters[j].weight * 2 / q * 3)
          }
          contentRewards = contentRewards + `* [${br[i].title}](https://dlux.io/@${br[i].post.author}/${br[i].post.permlink}) awarded ${parseFloat(parseInt(compa) - parseInt(bals.rc)).toFixed(3)} DLUX\n`
      }
      if (contentRewards) contentRewards = contentRewards + `\n*****\n`
      var vo = [],
          breaker = 0,
          tw = 0,
          ww = 0,
          ii = 100,
          steemVotes = ''
      for (var po = 0; po < cpost.length; po++) {
          if (cpost[po].block < num - 90720 && cpost[po].block > num - 123960) {
              vo.push(cpost[po])
              breaker = 1
          } else if (breaker) {
              break;
          }
      }
      for (var po = 0; po < vo.length; po++) {
          tw = tw + vo[po].totalWeight
      }
      ww = parseInt(tw / 100000)
      vo = sortBuyArray(vo, 'totalWeight')
      if (vo.length < ii) ii = vo.length
      for (var oo = 0; oo < ii; oo++) {
          var weight = parseInt(ww * vo[oo].totalWeight)
          if (weight > 10000) weight = 10000
          daops.push({type:'put',path:['escrow','dlux-io',`vote:${vo[oo].author}:${vo[oo].permlink}`], data: op[
              "vote",
              {
                  "voter": "dlux-io",
                  "author": vo[oo].author,
                  "permlink": vo[oo].permlink,
                  "weight": weight
              }
          ]})
          steemVotes = steemVotes + `* [${vo[oo].title}](https://dlux.io/@${vo[oo].author}/${vo[oo].permlink}) by @${vo[oo].author} | ${parseFloat(weight/100).toFixed(3)}% \n`
      }
      const footer = `[Visit dlux.io](https://dlux.io)\n[Find us on Discord](https://discord.gg/Beeb38j)\n[Visit our DEX/Wallet - Soon](https://dlux.io)\n[Learn how to use DLUX](https://github.com/dluxio/dluxio/wiki)\n[Turn off mentions for nodes and delegators](https://app.steemconnect.com/sign/custom-json?id=dluxT_nomention&json=%7B%22mention%22%3Afalse%7D) or [back on](https://app.steemconnect.com/sign/custom-json?id=dluxT_nomention&json=%7B%22mention%22%3Atrue%7D)\n*Price for 25.2 Hrs from posting or until daily 100,000.000 DLUX sold.`
      if (steemVotes) steemVotes = `#### Community Voted DLUX Posts\n` + steemVotes + `*****\n`
      post = header + contentRewards + steemVotes + post + footer
      var op = ["comment",
          {
              "parent_author": "",
              "parent_permlink": "dlux",
              "author": "dlux-io",
              "permlink": 'dlux' + num,
              "title": `DLUX DAO | Automated Report ${num}`,
              "body": post,
              "json_metadata": JSON.stringify({
                  tags: ["dlux", "ico", "dex", "cryptocurrency"]
              })
          }
      ]
      daops.push({type:'put',path:['dex'], data: dex})
      daops.push({type:'put',path:['stats'], data: stats})
      daops.push({type:'put',path:['balances'], data: bals})
      daops.push({type:'put',path:['markets','node'], data: mnode})
      daops.push({type:'put',path:['delegations'], data: deles})
      daops.push({type:'put',path:['escrow','dlux-io','comment'], data: op})
      store.batch(daops)
    })
}

function report(num) {
    agreements = {
        [config.username]: {
            node: config.username,
            agreement: true
        }
    }
    if (plasma.markets) {
        for (var node in plasma.markets.nodes) {
            if (plasma.markets.nodes[node].agreement) {
                agreements[node] = {
                    node,
                    agreement: true
                }
            }
        }
        store.children(['runners'], function(e, a) {

            for (var self in a) {
              const agree = plasma.markets.nodes[self] ? plasma.markets.nodes[self].agreement : false
              const test = plasma.markets.nodes[self] ? plasma.markets.nodes[self].agreement : false
                if (agreements[self]) {
                    agreements[self].top = true
                } else if (agree) {
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
            var feed = []
            store.someChildren(['feed'], {
                gte: num - 100,
                lte: num
            }, function(e, a) {
                feed = a
                NodeOps.push([
                    [0, 0],
                    ["custom_json",{
                      required_auths:  [],
                      required_posting_auths: [config.username],
                      id: 'dluxT_report',
                      json: JSON.stringify({
                          feed: feed,
                          agreements: agreements,
                          hash: plasma.hashLastIBlock,
                          block: plasma.hashBlock,
                          version: VERSION,
                          escrow: escrow,
                          stash: plasma.privHash
                      })
                    }]
                ]);
                /*
                transactor.json(config.username, config.active, 'report', { //nodeops instead
                    feed: feed,
                    agreements: agreements,
                    hash: plasma.hashLastIBlock,
                    block: plasma.hashBlock,
                    version: VERSION,
                    escrow: escrow,
                    stash: plasma.privHash
                }, function(err, result) {
                    if (err) {
                        console.error(err, `\nMost likely your ACCOUNT and KEY variables are not set!`);
                    } else {
                        console.log(current + `:Sent State report and published ${plasma.hashLastIBlock} for ${plasma.hashBlock}`)
                    }
                })
                */
            })
        })
    }
}

function exit(consensus) {
    console.log(`Restarting with ${consensus}...`);
    processor.stop(function() {
        startWith(consensus)
    });
}
function credit(node){
  store.get(['markets','node',node,'wins'],function(e,a){
    if(!e){
      const a2 = typeof a != 'number' ? 1 : a + 1
      store.batch([{type:'put',path:['markets','node',node,'wins'],data:a2}])
    } else {
      console.log(e)
    }
  })
}
function add(node, amount){
  store.get(['balances',node],function(e,a){
    if(!e){
      const a2 = typeof a != 'number' ? amount : a + amount
      store.batch([{type:'put',path:['balances', node],data:a2}])
    } else {
      console.log(e)
    }
  })
}

function chronAssign(block,op){
  store.someChildren(['chrono'], {
      gte: "" + parseInt(parseInt(block)),
      lte: "" + parseInt((block) + 1)
  }, function(e, a) {
      if (e) {
          console.log(e)
      } else {
          var t
          if (a.length && a.length < 10) {
              t = a.length
          } else if (a.length < 36) {
              t = String.fromCharCode(a.length + 55)
          } else if (a.length < 62) {
              t = String.fromCharCode(a.length + 61)
          } else if (a.length >=62){
            chronAssign(block+1,op)
          }
          if (!t) {
              t = `${block}:0`
          } else {
              var temp = t
              t = `${block}:${temp}`
          }
          store.batch([{type:'put',path:['chrono', chronAssign],data:op}])
      }
  })
}

function ipfsSaveState(blocknum, hashable) {
    ipfs.add(hashable, (err, IpFsHash) => {
        if (!err) {
            var hash = ''
            try {
                hash = IpFsHash[0].hash
            } catch (e) {
            }
            plasma.hashLastIBlock = hash
            plasma.hashBlock = blocknum
            console.log(current + `:Saved:  ${hash}`)
        } else {
            console.log({
                cycle
            }, 'IPFS Error', err)
            cycleipfs(cycle++)
            if (cycle >= 25) {
                cycle = 0;
                return;
            }
        }
    })
};

function asyncIpfsSaveState(blocknum, hashable) {
    return new Promise((resolve, reject) => {
        ipfs.add(hashable, (err, IpFsHash) => {
            if (!err) {
                resolve(IpFsHash[0].hash)
                console.log(current + `:Saved:  ${IpFsHash[0].hash}`)
            } else {
                resolve('Failed to save state.')
                console.log({
                    cycle
                }, 'IPFS Error', err)
                cycleipfs(cycle++)
                if (cycle >= 25) {
                    cycle = 0;
                    return;
                }
            }
        })
    })
};

function sortBuyArray(array, key) { //seek insert instead
    return array.sort(function(a, b) {
        return b[key] - a[key];
    });
}

function sortSellArray(array, key) { //seek insert instead
    return array.sort(function(a, b) {
        return a[key] - b[key];
    });
}

function noi(t) { //node ops incrementer and cleaner... 3 retries and out
    NodeOps[t][0][0] = 5
    NodeOps[t][0][1]++
    if (NodeOps[t][0][1] > 3) {
        NodeOps.splice(t, 1)
    }
}
