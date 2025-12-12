;; Simple Message Board Contract
;; This contract allows users to read and post messages for a fee in sBTC.

;; Define contract owner
(define-constant CONTRACT_OWNER tx-sender)

;; Define error codes
(define-constant ERR_NOT_ENOUGH_SBTC (err u1004))
(define-constant ERR_NOT_CONTRACT_OWNER (err u1005))
(define-constant ERR_BLOCK_NOT_FOUND (err u1003))
(define-constant ERR_CONTRACT_HASH_MISSING (err u1006))
(define-constant ERR_CONTRACT_HASH_MISMATCH (err u1007))

;; Define a map to store messages
;; Each message has an ID, content, author, and Bitcoin block height timestamp
(define-map messages
  uint
  {
    message: (string-utf8 280),
    author: principal,
    time: uint,
    stack-time: uint,
  }
)

;; Counter for total messages
(define-data-var message-count uint u0)
(define-data-var token-contract-hash (optional (buff 32)) none)

;; Public function to add a new message for 1 satoshi of sBTC
;; @format-ignore
(define-public (add-message (content (string-utf8 280)))
  (let (
        (id (+ (var-get message-count) u1))
        (actual-hash (contract-hash? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token))
       )
    (match actual-hash
      actual
        (begin
          ;; initialize expected hash once, then enforce equality
          (match (var-get token-contract-hash)
            expected (asserts! (is-eq expected actual) ERR_CONTRACT_HASH_MISMATCH)
            none (var-set token-contract-hash actual)
          )
          (try! (restrict-assets? contract-caller 
            ((with-ft 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token "sbtc-token" u1))
            (unwrap!
              ;; Charge 1 satoshi of sBTC from the caller
              (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
                transfer u1 contract-caller current-contract none
              )
              ERR_NOT_ENOUGH_SBTC
            )
          ))
          ;; Store the message with current Bitcoin block height
          (map-set messages id {
            message: content,
            author: contract-caller,
            time: burn-block-height,
            stack-time: stacks-block-time,
          })
          ;; Update message count
          (var-set message-count id)
          ;; Emit event for the new message
          (print {
            event: "[Stacks Dev Quickstart] New Message",
            message: content,
            id: id,
            author: contract-caller,
            author-ascii: (unwrap-panic (to-ascii? contract-caller)),
            time: burn-block-height,
            stack-time: stacks-block-time,
          })
          ;; Return the message ID
          (ok id)
        )
      none ERR_CONTRACT_HASH_MISSING
    )
  )
)

;; Withdraw function for contract owner to withdraw accumulated sBTC
(define-public (withdraw-funds)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) (err u1005))
    (let ((balance (unwrap-panic (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
        get-balance current-contract
      ))))
      (if (> balance u0)
        (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
          transfer balance current-contract CONTRACT_OWNER none
        )
        (ok false)
      )
    )
  )
)

;; Read-only function to get a message by ID
(define-read-only (get-message (id uint))
  (map-get? messages id)
)

;; Read-only function to get message author
(define-read-only (get-message-author (id uint))
  (get author (map-get? messages id))
)

;; Read-only function to get message count at a specific Stacks block height
(define-read-only (get-message-count-at-block (block uint))
  (ok (at-block
    (unwrap! (get-stacks-block-info? id-header-hash block) ERR_BLOCK_NOT_FOUND)
    (var-get message-count)
  ))
)

;; Read-only helper to report the tracked and live contract hash for sBTC
(define-read-only (get-token-hash-status)
  (let (
        (expected (var-get token-contract-hash))
        (actual (contract-hash? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token))
       )
    {
      expected: expected,
      actual: actual,
      matches: (and (is-some expected) (is-some actual) (is-eq expected actual))
    }
  )
)