'use strict';

/**
 * A wrapper for the DIBS Payment Services Flexwin API
 */

var q = require('q');
var request = require('request');

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
   *  Endpoint for ticket creation
  */
  createTicketUri: 'https://payment.architrade.com/cgi-ssl/auth.cgi',

  /*
   *  This service performs a credit and debit card check and saves the credit card
   *  information for recurring payments.
  */
  createTicket: function(options) {
    return this.dibsRequest(options, this.createTicketUri);
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
    return this.dibsRequest(options, this.authorizeTicketUri);
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
    return this.dibsRequest(options, this.captureTransactionUri);
  },

  /**
   *  Endpoint for refunding transactions
  */
  refundTransactionUri: 'https://payment.architrade.com/cgi-adm/refund.cgi',

  /**
   *  Endpoint for refunding transactions
  */
  refundTransaction: function(options) {
    return this.dibsRequest(options, this.refundTransactionUri, true);
  },

  /**
   *  Endpoint for refunding transactions
   */
  cancelTransactionUri: 'https://payment.architrade.com/cgi-adm/cancel.cgi',

  /**
   *  Endpoint for refunding transactions
   */
  cancelTransaction: function(options) {
    return this.dibsRequest(options, this.cancelTransactionUri, true);
  },

  /*
   *  Executes the https request to the DIBS server and fulfills the promise
   *  with the response JSON Object
  */
  dibsRequest: function(options, uri, authenticate) {
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

    request.post(params, function(err, res, body) {
      if (err) {
        return d.reject(err);
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
  }
};
