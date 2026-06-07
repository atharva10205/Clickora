export const IDL = {
  "address": "5AhkXaS77PEWP8pDdQx3SMDbEizqJFns6an8J42dXUuw",
  "metadata": {
    "name": "my_project",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claim",
      "discriminator": [
        62,
        198,
        214,
        193,
        213,
        159,
        108,
        210
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "advertiser"
              },
              {
                "kind": "account",
                "path": "ad.ad_id",
                "account": "Ad"
              }
            ]
          }
        },
        {
          "name": "ad",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "advertiser"
              },
              {
                "kind": "account",
                "path": "ad.ad_id",
                "account": "Ad"
              }
            ]
          }
        },
        {
          "name": "advertiser"
        },
        {
          "name": "publisher",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "claimable_amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "ad",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "advertiser"
              },
              {
                "kind": "account",
                "path": "ad.ad_id",
                "account": "Ad"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "advertiser"
              },
              {
                "kind": "account",
                "path": "ad.ad_id",
                "account": "Ad"
              }
            ]
          }
        },
        {
          "name": "advertiser",
          "writable": true,
          "signer": true
        },
        {
          "name": "service_fee",
          "writable": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialise_ad",
      "discriminator": [
        202,
        244,
        112,
        57,
        143,
        226,
        234,
        75
      ],
      "accounts": [
        {
          "name": "ad",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "advertiser"
              },
              {
                "kind": "arg",
                "path": "ad_id"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "advertiser"
              },
              {
                "kind": "arg",
                "path": "ad_id"
              }
            ]
          }
        },
        {
          "name": "advertiser",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "ad_id",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "record_impression",
      "discriminator": [
        118,
        199,
        131,
        33,
        198,
        152,
        151,
        235
      ],
      "accounts": [
        {
          "name": "ad",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "advertiser"
              },
              {
                "kind": "account",
                "path": "ad.ad_id",
                "account": "Ad"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "advertiser"
              },
              {
                "kind": "account",
                "path": "ad.ad_id",
                "account": "Ad"
              }
            ]
          }
        },
        {
          "name": "earnings",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  97,
                  114,
                  110,
                  105,
                  110,
                  103,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "ad"
              },
              {
                "kind": "account",
                "path": "publisher"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "advertiser"
        },
        {
          "name": "publisher"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "refund",
      "discriminator": [
        2,
        96,
        183,
        251,
        63,
        208,
        46,
        46
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "advertiser_key"
              },
              {
                "kind": "account",
                "path": "ad.ad_id",
                "account": "Ad"
              }
            ]
          }
        },
        {
          "name": "ad",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "advertiser_key"
              },
              {
                "kind": "account",
                "path": "ad.ad_id",
                "account": "Ad"
              }
            ]
          }
        },
        {
          "name": "advertiser_key"
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "withdraw_amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Ad",
      "discriminator": [
        81,
        91,
        73,
        106,
        215,
        137,
        214,
        47
      ]
    },
    {
      "name": "EarningsRecord",
      "discriminator": [
        130,
        137,
        103,
        163,
        31,
        68,
        239,
        194
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized."
    },
    {
      "code": 6001,
      "name": "InsufficientVault",
      "msg": "Insufficient vault balance."
    },
    {
      "code": 6002,
      "name": "AdInactive",
      "msg": "Ad is not active."
    },
    {
      "code": 6003,
      "name": "InvalidAmount",
      "msg": "Invalid amount."
    },
    {
      "code": 6004,
      "name": "Overflow",
      "msg": "Overflow in calculation."
    },
    {
      "code": 6005,
      "name": "InvalidFeeRecipient",
      "msg": "Invalid fee recipient."
    }
  ],
  "types": [
    {
      "name": "Ad",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ad_id",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "advertiser",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "is_active",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "EarningsRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "publisher",
            "type": "pubkey"
          },
          {
            "name": "ad",
            "type": "pubkey"
          },
          {
            "name": "claimable_amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
}
export const PROGRAM_ID = "5AhkXaS77PEWP8pDdQx3SMDbEizqJFns6an8J42dXUuw";