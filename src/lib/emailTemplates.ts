import { OrderRecord } from '@/types';
import { CFG } from './products';
import { money } from './utils';

// Helper to format date
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Recently placed';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// Common Brand Header HTML
function getEmailHeader(title: string, subtitle: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #130b21 0%, #200f3d 100%); border-radius: 18px 18px 0 0; padding: 36px 30px; text-align: center; border-bottom: 2px solid #7c3aed;">
      <tr>
        <td align="center">
          <div style="display: inline-block; background: #7c3aed; color: #ffffff; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; font-weight: 800; font-size: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
            Mi
          </div>
          <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; font-family: 'Instrument Serif', Georgia, serif; letter-spacing: -0.02em;">
            Mi<span style="color: #c4b5fd;">Collections</span>
          </h1>
          <p style="margin: 4px 0 0 0; color: #a78bfa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600;">
            Every Variety • One Home • FCT Abuja
          </p>
          <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid rgba(167, 139, 250, 0.2);">
            <div style="display: inline-block; background: rgba(124, 58, 237, 0.3); border: 1px solid #a78bfa; border-radius: 999px; padding: 6px 18px; color: #f5f3ff; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${title}
            </div>
            <p style="margin: 10px 0 0 0; color: #ddd6fe; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${subtitle}
            </p>
          </div>
        </td>
      </tr>
    </table>
  `;
}

// Common Brand Footer HTML
function getEmailFooter(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #0d0617; border-radius: 0 0 18px 18px; padding: 28px 24px; text-align: center; color: #9a8cb8; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border-top: 1px solid rgba(124, 58, 237, 0.2);">
      <tr>
        <td align="center">
          <p style="margin: 0 0 8px 0; color: #f5f3ff; font-weight: 600; font-size: 13px;">
            MiCollections Nigeria — Open 24 Hours
          </p>
          <p style="margin: 0 0 12px 0; color: #a78bfa; line-height: 1.5;">
            Abuja HQ • Doorstep & Nationwide Courier Delivery<br/>
            WhatsApp Customer Care: <a href="https://wa.me/${CFG.phone}" style="color: #25d366; text-decoration: none; font-weight: 600;">${CFG.phoneDisp}</a>
          </p>
          <div style="padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 11px; color: #766991;">
            © ${new Date().getFullYear()} MiCollections. All rights reserved. Customers order, we don't scam.
          </div>
        </td>
      </tr>
    </table>
  `;
}

/**
 * 1. Generate Order Confirmation Email (Customer Receipt)
 */
export function generateOrderConfirmationEmail(order: OrderRecord): string {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f0e7ff;">
        <td style="padding: 14px 10px; font-size: 14px; color: #1e1136; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <strong style="color: #0f0721; display: block; font-size: 14px;">${item.name}</strong>
          <span style="display: inline-block; font-size: 12px; color: #6d28d9; background: #f5edff; border-radius: 6px; padding: 2px 8px; margin-top: 4px;">
            ${item.opt} • ${item.color}
          </span>
        </td>
        <td style="padding: 14px 10px; text-align: center; font-size: 14px; color: #4a3d63; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${item.qty}
        </td>
        <td style="padding: 14px 10px; text-align: right; font-size: 14px; color: #4a3d63; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${money(item.price)}
        </td>
        <td style="padding: 14px 10px; text-align: right; font-size: 14px; font-weight: 700; color: #7c3aed; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${money(item.price * item.qty)}
        </td>
      </tr>
    `
    )
    .join('');

  const isBankTransfer = order.paymentMethod === 'transfer';
  const paymentNotice = isBankTransfer
    ? `
      <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 12px; padding: 18px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700;">
          ⚠️ Bank Transfer Instructions
        </h4>
        <p style="margin: 0 0 10px 0; color: #78350f; font-size: 13px; line-height: 1.5;">
          Please transfer the exact total of <strong>${money(order.total)}</strong> using your Order ID <strong>${order.id}</strong> as narration:
        </p>
        <table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="background: #ffffff; border-radius: 8px; border: 1px solid #fde68a; font-size: 13px; color: #451a03;">
          <tr><td><strong>Bank:</strong></td><td>Zenith Bank</td></tr>
          <tr><td><strong>Account Number:</strong></td><td><strong style="color: #7c3aed; font-size: 15px;">1012345678</strong></td></tr>
          <tr><td><strong>Account Name:</strong></td><td>MiCollections Ltd</td></tr>
          <tr><td><strong>Reference:</strong></td><td>${order.id}</td></tr>
        </table>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #92400e;">
          After making the transfer, please send proof of payment to our WhatsApp helpline at <a href="https://wa.me/${CFG.phone}?text=Hello+MiCollections,+here+is+my+payment+proof+for+order+${order.id}" style="color: #25d366; font-weight: 700; text-decoration: underline;">${CFG.phoneDisp}</a>.
        </p>
      </div>
    `
    : `
      <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-left: 4px solid #10b981; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; color: #065f46; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600;">
          ✓ Payment Method: ${order.payLabel} • Status: ${order.paymentStatus === 'paid' ? 'Payment Verified & Confirmed' : 'Pending fulfillment'}
        </p>
      </div>
    `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>MiCollections Order Confirmation #${order.id}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f7f3fd; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 18px; box-shadow: 0 12px 36px rgba(76, 29, 149, 0.12); overflow: hidden;">
        <tr>
          <td>
            ${getEmailHeader(`Order Confirmation #${order.id}`, `Hello ${order.name}, thank you for ordering from MiCollections.`)}
            
            <div style="padding: 28px 24px;">
              <!-- Intro -->
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #2c1a4d; line-height: 1.6;">
                We have received your order and are currently packaging your items. Below is your detailed receipt and delivery dossier.
              </p>

              <!-- Meta Summary Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #fdfcff; border: 1px solid #e9d5ff; border-radius: 12px; margin-bottom: 24px; padding: 14px 18px;">
                <tr>
                  <td width="50%" style="vertical-align: top; padding: 6px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #6d28d9; font-weight: 700; letter-spacing: 0.05em; display: block;">Order ID</span>
                    <strong style="font-size: 15px; color: #0e0718;">#${order.id}</strong>
                  </td>
                  <td width="50%" style="vertical-align: top; padding: 6px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #6d28d9; font-weight: 700; letter-spacing: 0.05em; display: block;">Placed On</span>
                    <span style="font-size: 13px; color: #2c1a4d;">${formatDate(order.createdAt)}</span>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="vertical-align: top; padding: 6px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #6d28d9; font-weight: 700; letter-spacing: 0.05em; display: block;">Delivery Method</span>
                    <strong style="font-size: 13px; color: #0e0718;">${order.deliveryLabel}</strong>
                    <span style="display: block; font-size: 12px; color: #7c3aed;">(ETA: ${order.eta})</span>
                  </td>
                  <td width="50%" style="vertical-align: top; padding: 6px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #6d28d9; font-weight: 700; letter-spacing: 0.05em; display: block;">Fulfillment Status</span>
                    <span style="display: inline-block; background: #e9d5ff; color: #4c1d95; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: capitalize;">
                      ${order.orderStatus || 'received'}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Payment Notice -->
              ${paymentNotice}

              <!-- Items Table -->
              <h3 style="margin: 24px 0 12px 0; font-size: 16px; color: #0f0721; font-weight: 700; border-bottom: 2px solid #f0e7ff; padding-bottom: 8px;">
                Itemized Order Details
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background: #f8f4ff; color: #581c87; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                    <th align="left" style="padding: 10px; border-radius: 8px 0 0 8px;">Item</th>
                    <th align="center" style="padding: 10px;">Qty</th>
                    <th align="right" style="padding: 10px;">Unit Price</th>
                    <th align="right" style="padding: 10px; border-radius: 0 8px 8px 0;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Financial Totals Table -->
              <table role="presentation" width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px; margin-bottom: 24px;">
                <tr>
                  <td align="right" style="color: #4a3d63;">Subtotal:</td>
                  <td align="right" width="120" style="color: #0e0718; font-weight: 600;">${money(order.subtotal)}</td>
                </tr>
                <tr>
                  <td align="right" style="color: #4a3d63;">Delivery Fee (${order.deliveryLabel}):</td>
                  <td align="right" style="color: #0e0718; font-weight: 600;">${order.fee > 0 ? money(order.fee) : 'FREE'}</td>
                </tr>
                ${
                  order.discount > 0
                    ? `
                  <tr>
                    <td align="right" style="color: #10b981;">Discount Applied:</td>
                    <td align="right" style="color: #10b981; font-weight: 600;">-${money(order.discount)}</td>
                  </tr>
                `
                    : ''
                }
                <tr style="border-top: 2px solid #e9d5ff;">
                  <td align="right" style="padding-top: 10px; font-size: 17px; font-weight: 800; color: #1e1136;">Grand Total:</td>
                  <td align="right" style="padding-top: 10px; font-size: 18px; font-weight: 800; color: #7c3aed;">${money(order.total)}</td>
                </tr>
              </table>

              <!-- Customer & Delivery Dossier -->
              <div style="background: #fbf9ff; border: 1px solid #f0e7ff; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #4c1d95; text-transform: uppercase; letter-spacing: 0.05em;">
                  Delivery Dossier
                </h4>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #0e0718;"><strong>Recipient:</strong> ${order.name}</p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #0e0718;"><strong>Phone:</strong> ${order.phone}</p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #0e0718;"><strong>Email:</strong> ${order.email}</p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #0e0718;"><strong>Address:</strong> ${order.address}</p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #0e0718;"><strong>State:</strong> ${order.state}</p>
                ${order.landmark ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #6d28d9;"><strong>Landmark:</strong> ${order.landmark}</p>` : ''}
                ${order.note ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #4a3d63; font-style: italic;"><strong>Note:</strong> "${order.note}"</p>` : ''}
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="https://wa.me/${CFG.phone}?text=Hello+MiCollections,+I+am+checking+on+my+order+${order.id}" style="display: inline-block; background: #25d366; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);">
                  💬 Message Us on WhatsApp
                </a>
              </div>
            </div>

            ${getEmailFooter()}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * 2. Generate Admin Alert Email (Store Staff Notification)
 */
export function generateAdminAlertEmail(order: OrderRecord): string {
  const itemsText = order.items
    .map((it) => `• [x] ${it.qty}x ${it.name} (${it.opt}, ${it.color}) — ${money(it.price * it.qty)}`)
    .join('<br/>');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>🚨 Admin Alert: New Order #${order.id}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #0f071d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 18px; box-shadow: 0 14px 40px rgba(0,0,0,0.4); overflow: hidden;">
        <tr>
          <td>
            ${getEmailHeader(`STORE ALERT • ORDER #${order.id}`, `New Customer Order: ${money(order.total)} from ${order.name} (${order.state})`)}

            <div style="padding: 28px 24px;">
              <!-- Urgent Badge -->
              <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-left: 4px solid #db2777; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 6px 0; color: #9d174d; font-size: 16px;">
                  ⚡ Action Required: Inspect & Package Order #${order.id}
                </h3>
                <p style="margin: 0; color: #831843; font-size: 13px; line-height: 1.5;">
                  A new order has been logged into the MiCollections backend. Verify payment status, check inventory stock, and prepare packing slip for courier dispatch.
                </p>
              </div>

              <!-- Customer Contact Matrix -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #fcfaff; border: 1px solid #e9d5ff; border-radius: 12px; margin-bottom: 24px; padding: 18px;">
                <tr>
                  <td width="50%" style="vertical-align: top; padding: 6px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #6d28d9; font-weight: 700;">Customer Name</span>
                    <strong style="font-size: 15px; color: #0e0718; display: block;">${order.name}</strong>
                  </td>
                  <td width="50%" style="vertical-align: top; padding: 6px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #6d28d9; font-weight: 700;">Phone Number</span>
                    <strong style="font-size: 15px; color: #0e0718; display: block;">
                      <a href="tel:${order.phone}" style="color: #7c3aed; text-decoration: none;">${order.phone}</a>
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="vertical-align: top; padding: 6px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #6d28d9; font-weight: 700;">Destination State</span>
                    <strong style="font-size: 14px; color: #0e0718; display: block;">${order.state}</strong>
                  </td>
                  <td width="50%" style="vertical-align: top; padding: 6px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #6d28d9; font-weight: 700;">Payment & Status</span>
                    <span style="display: block; font-size: 13px; font-weight: 700; color: ${order.paymentStatus === 'paid' ? '#059669' : '#d97706'};">
                      ${order.payLabel} (${order.paymentStatus ? order.paymentStatus.toUpperCase() : 'PENDING'})
                    </span>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 6px; border-top: 1px solid #f3e8ff;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #6d28d9; font-weight: 700;">Delivery Address & Landmark</span>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #1e1136;">
                      ${order.address} ${order.landmark ? `<br/><span style="color: #7c3aed; font-weight: 600;">Landmark: ${order.landmark}</span>` : ''}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Warehouse Packing Checklist -->
              <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #4c1d95; text-transform: uppercase; letter-spacing: 0.05em;">
                Warehouse Checklist:
              </h4>
              <div style="background: #ffffff; border: 1px solid #d8b4fe; border-radius: 10px; padding: 14px; font-size: 14px; color: #2e1065; line-height: 1.8; margin-bottom: 24px;">
                ${itemsText}
              </div>

              <!-- Quick WhatsApp Contact Button for Admin -->
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://wa.me/${order.phone.replace(/^0/, '234').replace(/[^0-9]/g, '')}?text=Hello+${encodeURIComponent(order.name)},+we+received+your+MiCollections+order+${order.id}+and+are+preparing+it." style="display: inline-block; background: #25d366; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; margin-right: 8px;">
                  💬 Chat Customer on WhatsApp
                </a>
              </div>
            </div>

            ${getEmailFooter()}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * 3. Generate Dispatch Email (Customer Delivery Notice)
 */
export function generateDispatchEmail(
  order: OrderRecord,
  trackingInfo?: string
): string {
  const trackingNotice = trackingInfo
    ? trackingInfo
    : order.deliveryLabel.toLowerCase().includes('abuja')
    ? 'Handed to Abuja Doorstep Express Courier. The rider will contact you upon arriving at your address.'
    : 'Handed to our nationwide logistics partner (GIG Logistics / Speedaf / FedEx). Transit ETA: ' + order.eta + '.';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Your MiCollections Order #${order.id} is on the way!</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f7f3fd; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 18px; box-shadow: 0 12px 36px rgba(76, 29, 149, 0.12); overflow: hidden;">
        <tr>
          <td>
            ${getEmailHeader(`Order #${order.id} Dispatched!`, `Good news, ${order.name}! Your package has left our Abuja fulfilment hub.`)}

            <div style="padding: 28px 24px;">
              <!-- Dispatch Status Banner -->
              <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-left: 4px solid #7c3aed; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 6px 0; color: #5b21b6; font-size: 17px;">
                  🚚 Package On The Move
                </h3>
                <p style="margin: 0 0 10px 0; color: #4c1d95; font-size: 14px; line-height: 1.5;">
                  ${trackingNotice}
                </p>
                <div style="background: #ffffff; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #1e1136; border: 1px solid #e9d5ff;">
                  <strong>Estimated Delivery:</strong> ${order.eta}
                </div>
              </div>

              <!-- Shipping Destination Review -->
              <div style="background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <span style="font-size: 11px; text-transform: uppercase; color: #7c3aed; font-weight: 700; display: block; margin-bottom: 6px;">
                  Delivery Address:
                </span>
                <p style="margin: 0; font-size: 14px; color: #0e0718; line-height: 1.5;">
                  <strong>${order.name}</strong> (${order.phone})<br/>
                  ${order.address}, ${order.state}
                  ${order.landmark ? `<br/><span style="color: #6d28d9; font-weight: 600;">Landmark: ${order.landmark}</span>` : ''}
                </p>
              </div>

              <!-- Items in this package -->
              <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #4c1d95; text-transform: uppercase; letter-spacing: 0.05em;">
                Items in this parcel (${order.items.length}):
              </h4>
              <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; color: #2e1065; line-height: 1.8;">
                ${order.items.map((it) => `<li><strong>${it.qty}x</strong> ${it.name} (${it.opt})</li>`).join('')}
              </ul>

              <!-- Important Customer Tip -->
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px; font-size: 13px; color: #065f46; margin-bottom: 28px;">
                💡 <strong>Delivery Tip:</strong> Please keep your phone (${order.phone}) charged and accessible so the delivery dispatch rider can call you as they approach your landmark.
              </div>

              <!-- WhatsApp Support Button -->
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://wa.me/${CFG.phone}?text=Hello+MiCollections,+I+have+a+question+regarding+dispatch+of+order+${order.id}" style="display: inline-block; background: #25d366; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);">
                  💬 Contact Delivery Care on WhatsApp
                </a>
              </div>
            </div>

            ${getEmailFooter()}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
