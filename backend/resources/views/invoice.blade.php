<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $payment->invoice_number }}</title>
    <style>
        body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif; }
        .invoice { max-width: 860px; margin: 32px auto; background: white; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
        .head { background: #0f172a; color: white; padding: 28px; display: flex; justify-content: space-between; gap: 20px; }
        .brand { font-size: 28px; font-weight: 900; }
        .body { padding: 28px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
        .box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
        .muted { color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: .06em; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th, td { padding: 14px; border-bottom: 1px solid #e2e8f0; text-align: left; }
        th { color: #475569; font-size: 13px; text-transform: uppercase; }
        .total { font-size: 24px; font-weight: 900; color: #1d4ed8; }
        .badge { display: inline-block; border-radius: 999px; padding: 7px 12px; background: #dbeafe; color: #1d4ed8; font-weight: 800; text-transform: capitalize; }
        .foot { padding: 18px 28px 28px; color: #64748b; font-size: 13px; }
    </style>
</head>
<body>
    <main class="invoice">
        <section class="head">
            <div>
                <div class="brand">TunaTuna</div>
                <p>Smart Service Hiring Platform</p>
            </div>
            <div>
                <div class="muted">Invoice</div>
                <strong>{{ $payment->invoice_number }}</strong>
            </div>
        </section>
        <section class="body">
            <div class="grid">
                <div class="box">
                    <div class="muted">Customer</div>
                    <h3>{{ $payment->customer->full_name }}</h3>
                    <p>{{ $payment->customer->email }}<br>{{ $payment->customer->phone }}<br>{{ $payment->booking->address }}</p>
                </div>
                <div class="box">
                    <div class="muted">Transaction</div>
                    <p><strong>Transaction ID:</strong> {{ $payment->transaction_id }}</p>
                    <p><strong>Payment ID:</strong> {{ $payment->payment_id }}</p>
                    <p><strong>Status:</strong> <span class="badge">{{ $payment->payment_status }}</span></p>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Worker</th>
                        <th>Date & Time</th>
                        <th>Method</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ $payment->booking->category->name }}</td>
                        <td>{{ $payment->worker->full_name }}</td>
                        <td>{{ $payment->booking->booking_date->format('d M Y') }} at {{ substr($payment->booking->booking_time, 0, 5) }}</td>
                        <td>{{ strtoupper(str_replace('_', ' ', $payment->payment_method)) }}</td>
                        <td class="total">INR {{ number_format((float) $payment->amount, 2) }}</td>
                    </tr>
                </tbody>
            </table>
        </section>
        <section class="foot">
            This is a localhost demo invoice. No real money was transferred through Razorpay, Stripe, UPI networks, banks, or wallets.
        </section>
    </main>
</body>
</html>
