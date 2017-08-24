'use strict';

/**
 * A wrapper for the DIBS Payment Services Flexwin API
 */

var q = require('q');
var request = require('request');
var md5 = require('md5');

request.defaults({
  jar: false,
  pool: false
});

module.exports = {

  /*
   *  Sets a global test mode
  */
  testMode: false,

  /*
   *  Sets a global merchant id
  */
  merchant: null,

  /*
   *  Sets a global user
  */
  username: null,

  /*
   *  Sets a global password
  */
  password: null,

  /*
   *  Sets a globale MD5 encryption keys
   */
  md5: { key1: null, key2: null },

  /*
   *  Endpoint for ticket creation
  */
  createTicketUri: 'https://payment.architrade.com/cgi-ssl/auth.cgi',

  /*
   *  This service performs a credit and debit card check and saves the credit card
   *  information for recurring payments.
  */
  createTicket: function(options) {
    return this.dibsRequest(options, this.createTicketUri, ['merchant', 'orderid', 'preauth', 'currency', 'amount']);
  },

  /**
   *  Endpoint for ticket authorizations
  */
  authorizeTicketUri: 'https://payment.architrade.com/cgi-ssl/ticket_auth.cgi',

  /**
   *  Make a recurring payment using a ticket previously created via the
   *  createTicket service.
  */
  authorizeTicket: function(options) {
    return this.dibsRequest(options, this.authorizeTicketUri, ['merchant', 'orderid', 'ticket', 'currency', 'amount']);
  },

  /**
   *  Endpoint for capturing transactions
  */
  captureTransactionUri: 'https://payment.architrade.com/cgi-bin/capture.cgi',

  /**
   *  The second part of any transaction is the capture process. Usually this take place
   *  at the time of shipping the goods to the customer.
  */
  captureTransaction: function(options) {
    return this.dibsRequest(options, this.captureTransactionUri, ['merchant', 'orderid', 'transact', 'amount']);
  },

  /**
   *  Endpoint for refunding transactions
  */
  refundTransactionUri: 'https://payment.architrade.com/cgi-adm/refund.cgi',

  /**
   *  Endpoint for refunding transactions
  */
  refundTransaction: function(options) {
    return this.dibsRequest(options, this.refundTransactionUri, ['merchant', 'orderid', 'transact', 'amount'], true);
  },

  /**
   *  Endpoint for cancelling transactions
   */
  cancelTransactionUri: 'https://payment.architrade.com/cgi-adm/cancel.cgi',

  /**
   *  Endpoint for cancelling transactions
   */
  cancelTransaction: function(options) {
    return this.dibsRequest(options, this.cancelTransactionUri, ['merchant', 'orderid', 'transact'], true);
  },

  /**
   *  Endpoint for deleting ticket
   */
  delTicketUri: 'https://payment.architrade.com/cgi-adm/delticket.cgi',

  /*
   *  deleting tickets, with the result that the ticket
   *  and its corresponding fixed transaction rules are deleted
  */
  delTicket: function(options) {
    return this.dibsRequest(options, this.delTicketUri, ['merchant', 'ticket']);
  },

  /*
   *  Executes the https request to the DIBS server and fulfills the promise
   *  with the response JSON Object
  */
  dibsRequest: function(options, uri, MD5Params,  authenticate) {
    if (this.testMode) {
      options.test = 'yes';
    }
    if (!options.merchant && this.merchant) {
      options.merchant = this.merchant;
    }

    options.textreply = 'yes';
    options.fullreply = 'yes';

    var self = this;
    var d = q.defer();

    var params = { uri: uri, form: options };
    if (authenticate) {
      params.auth = {};
      params.auth.username = options.username || this.username;
      params.auth.password = options.password || this.password;
    }

    if (self.md5.key1 && self.md5.key2) {
      options.md5key = self.getMD5Key(MD5Params, options);
    }

    request.post(params, function(err, res, body) {
      if (err || !res.statusCode.toString().startsWith(2)) {
        return d.reject(err || body);
      }
      try {
        d.resolve(self.parseDibsResponse(body));
      }
      catch (err) {
        d.reject(err);
      }
    });

    return d.promise;
  },

  /*
   * Converts the DIBS text reply to a javascript object
  */
  parseDibsResponse: function(str) {
    var parts = str.split('&');
    var res = {};
    for(var i = 0, l = parts.length; i<l; i++) {
      var item = parts[i].split('=');
      res[item[0]] = decodeURIComponent(item[1]);
    }
    return res;
  },

  /**
   * Generates the 'md5'
   * @param  {[type]} MD5Params [description]
   * @param  {[type]} options   [description]
   * @return {[type]}           [description]
   */
  getMD5Key: function(MD5Params, options) {
    var string = '';
    MD5Params.forEach(function(param) {
      string += param.toLowerCase() + '=' + options[param] + '&';
    });
    return this.encodeMD5(string.slice(0, -1));
  },

  /**
   * Encodes a string using the setup keys
   * @param  {[type]} message [description]
   * @param  {[type]} key1    [description]
   * @param  {[type]} key2    [description]
   * @return {[type]}         [description]
   */
  encodeMD5: function(message, key1, key2) {
    key1 = key1 || this.md5.key1;
    key2 = key2 || this.md5.key2;
    return md5(key2 + md5(key1 + message));
  }
};
