import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const onTrainingRegistered = onDocumentCreated("trainings/{trainingId}/registrations/{regId}", async (event) => {
  const regData = event.data?.data();
  if (!regData) return;

  try {
    const trainingRef = db.collection('trainings').doc(event.params.trainingId);
    const trainingSnap = await trainingRef.get();

    if (!trainingSnap.exists) {
      console.log(`[Purchase Automation] Pelatihan dengan ID ${event.params.trainingId} tidak ditemukan.`);
      return;
    }

    const trainingData = trainingSnap.data();

    if (trainingData?.isFree || !trainingData?.price || trainingData.price <= 0) {
      console.log(`[Purchase Automation] Pelatihan ${trainingData?.title} adalah gratis. Invoice tidak diterbitkan.`);
      return;
    }

    const price = trainingData.price;
    const dateObj = new Date();
    // Format YYYYMMDD
    const dateStr = dateObj.toISOString().split('T')[0].replace(/-/g, '');
    const invNumber = `INV/TRN/${dateStr}/${Math.floor(1000 + Math.random() * 9000)}`;

    const appId = process.env.NEXT_PUBLIC_APP_ID || 'blud-app-dev';

    const newInvoice = {
      invoiceNumber: invNumber,
      customerName: regData.name || 'Peserta Pelatihan',
      customerType: 'Umum',
      customerEmail: regData.email || '',
      customerPhone: regData.phone || '',
      items: [{
        id: Date.now().toString(),
        referenceType: 'TRAINING',
        // Menyimpan TrainingID dan RegID agar bisa dilacak oleh Sync-Back
        referenceId: `${event.params.trainingId}::${event.params.regId}`, 
        description: `Tiket Pelatihan: ${trainingData.title}`,
        quantity: 1,
        unitPrice: price,
        total: price
      }],
      subTotal: price,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: price,
      paidAmount: 0,
      remainingAmount: price, 
      term: 'FULL_PAYMENT',
      // Memastikan format tanggal bersih YYYY-MM-DD
      date: dateObj.toISOString().split('T')[0],
      dueDate: new Date(dateObj.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'PENDING',
      history: [],
      notes: `Pembayaran tiket pelatihan untuk peserta: ${regData.name}\nAsal instansi/institusi: ${regData.origin || '-'}`,
      createdAt: Date.now()
    };

    await db.collection(`artifacts/${appId}/public/data/invoices`).add(newInvoice);
    console.log(`[Purchase Automation] Berhasil membuat tagihan ${invNumber} untuk tiket pelatihan.`);

  } catch (error) {
    console.error(`[Purchase Automation Error] Gagal membuat invoice untuk pendaftaran ${event.params.regId}:`, error);
  }
});

export const onCatalogOrderCreated = onDocumentCreated("artifacts/{appId}/public/data/orders/{orderId}", async (event) => {
  const orderData = event.data?.data();
  if (!orderData) return;

  const db = admin.firestore();
  const appId = event.params.appId;

  try {
    console.log(`[Purchase Automation] Memproses Order Katalog: ${event.params.orderId}`);

    const totalAmount = orderData.totalPrice || orderData.totalAmount || 0;
    
    if (totalAmount <= 0) {
      console.log(`[Purchase Automation] Order ${event.params.orderId} senilai 0. Invoice dibatalkan.`);
      return;
    }

    const dateObj = new Date();
    const dateStr = dateObj.toISOString().split('T')[0].replace(/-/g, '');
    const invNumber = `INV/ORD/${dateStr}/${Math.floor(1000 + Math.random() * 9000)}`;

    const invoiceItems = (orderData.items || []).map((item: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      referenceType: 'CATALOG',
      referenceId: event.params.orderId,
      description: `Pembelian Produk: ${item.name || item.productName}`,
      quantity: item.quantity || 1,
      unitPrice: item.price || item.unitPrice || 0,
      total: (item.quantity || 1) * (item.price || item.unitPrice || 0)
    }));

    if (invoiceItems.length === 0) {
      invoiceItems.push({
        id: Date.now().toString(),
        referenceType: 'CATALOG',
        referenceId: event.params.orderId,
        description: `Pesanan Katalog dari ${orderData.tenantName || 'Sistem'}`,
        quantity: 1,
        unitPrice: totalAmount,
        total: totalAmount
      });
    }

    const newInvoice = {
      invoiceNumber: invNumber,
      customerName: orderData.customerName || orderData.buyerName || 'Pelanggan Katalog',
      customerType: 'Umum',
      customerEmail: orderData.customerEmail || orderData.buyerEmail || '',
      customerPhone: orderData.customerPhone || orderData.buyerPhone || '',
      items: invoiceItems,
      subTotal: totalAmount,
      taxAmount: orderData.taxAmount || 0,
      discountAmount: orderData.discountAmount || 0,
      totalAmount: totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      term: 'FULL_PAYMENT',
      date: dateObj.toISOString().split('T')[0],
      dueDate: new Date(dateObj.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
      status: 'PENDING',
      history: [],
      notes: orderData.notes ? `Catatan Pemesan: ${orderData.notes}` : `Pembelian dari e-Katalog.`,
      createdAt: Date.now()
    };

    await db.collection(`artifacts/${appId}/public/data/invoices`).add(newInvoice);
    console.log(`[Purchase Automation] Berhasil membuat tagihan ${invNumber} untuk Order Katalog.`);

  } catch (error) {
    console.error(`[Purchase Automation Error] Gagal membuat invoice untuk order ${event.params.orderId}:`, error);
  }
});