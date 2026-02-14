// functions/notifications.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Configuration email (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email?.user || 'j_nguetsop@yahoo.com',
    pass: functions.config().email?.password || 'VOTRE_MOT_DE_PASSE_APP'
  }
});

// ========== RAPPEL SÉANCE (24h AVANT) ==========
exports.sendSessionReminders = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('Europe/Paris')
  .onRun(async (context) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const rotationsSnap = await admin.firestore()
      .collection('rotations')
      .where('date', '==', tomorrowDate)
      .where('status', '==', 'scheduled')
      .get();

    const notifications = [];

    for (const doc of rotationsSnap.docs) {
      const rotation = doc.data();
      
      // Récupérer les membres
      const membersSnap = await admin.firestore()
        .collection('members')
        .where('userId', '==', rotation.userId)
        .get();

      const userDoc = await admin.firestore()
        .collection('users')
        .doc(rotation.userId)
        .get();
      
      const userEmail = userDoc.data()?.email;

      for (const memberDoc of membersSnap.docs) {
        const member = memberDoc.data();
        
        if (member.email) {
          // Email
          const emailPromise = transporter.sendMail({
            from: '"Tontine Pour Tous" <notifications@tontine.com>',
            to: member.email,
            subject: '🔔 Rappel : Séance de tontine demain',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">🔔 Rappel de Séance</h1>
                </div>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 18px; color: #333;">Bonjour <strong>${member.name}</strong>,</p>
                  <p style="font-size: 16px; color: #555;">La prochaine séance de tontine aura lieu <strong>demain ${new Date(rotation.date).toLocaleDateString('fr-FR')}</strong>.</p>
                  
                  ${rotation.location ? `<p style="font-size: 16px; color: #555;">📍 <strong>Lieu :</strong> ${rotation.location}</p>` : ''}
                  
                  <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #667eea; margin-top: 0;">Informations</h3>
                    <ul style="list-style: none; padding: 0;">
                      <li style="margin: 10px 0;">📅 <strong>Date :</strong> ${new Date(rotation.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                      <li style="margin: 10px 0;">👤 <strong>Hôte :</strong> ${rotation.hostMemberId}</li>
                      <li style="margin: 10px 0;">💰 <strong>Bénéficiaire :</strong> ${rotation.beneficiaryMemberId}</li>
                    </ul>
                  </div>
                  
                  <p style="font-size: 14px; color: #888; margin-top: 30px;">N'oubliez pas d'apporter votre cotisation !</p>
                  <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 20px;">Tontine Pour Tous - Votre tontine digitale</p>
                </div>
              </div>
            `
          });
          notifications.push(emailPromise);
        }
      }
    }

    await Promise.all(notifications);
    console.log(`✅ ${notifications.length} rappels envoyés`);
  });

// ========== COTISATION EN RETARD ==========
exports.checkOverdueContributions = functions.pubsub
  .schedule('every monday 10:00')
  .timeZone('Europe/Paris')
  .onRun(async (context) => {
    const usersSnap = await admin.firestore().collection('users').get();
    const notifications = [];

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      
      // Récupérer les membres
      const membersSnap = await admin.firestore()
        .collection('members')
        .where('userId', '==', userId)
        .get();

      // Récupérer les transactions des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const memberDoc of membersSnap.docs) {
        const member = memberDoc.data();
        
        const transactionsSnap = await admin.firestore()
          .collection('transactions')
          .where('userId', '==', userId)
          .where('memberId', '==', memberDoc.id)
          .where('type', '==', 'contribution')
          .where('createdAt', '>=', thirtyDaysAgo.toISOString())
          .get();

        // Si aucune cotisation depuis 30 jours
        if (transactionsSnap.empty && member.email) {
          const emailPromise = transporter.sendMail({
            from: '"Tontine Pour Tous" <notifications@tontine.com>',
            to: member.email,
            subject: '⚠️ Cotisation en retard',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">⚠️ Cotisation en Retard</h1>
                </div>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 18px; color: #333;">Bonjour <strong>${member.name}</strong>,</p>
                  <p style="font-size: 16px; color: #555;">Nous avons remarqué que vous n'avez pas effectué de cotisation depuis <strong>plus de 30 jours</strong>.</p>
                  
                  <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <p style="margin: 0; color: #856404;"><strong>⏰ Rappel :</strong> Les cotisations régulières sont essentielles au bon fonctionnement de la tontine.</p>
                  </div>
                  
                  <p style="font-size: 16px; color: #555;">Merci de régulariser votre situation dès que possible.</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://tontine-app.web.app" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Effectuer ma cotisation</a>
                  </div>
                  
                  <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 20px;">Tontine Pour Tous</p>
                </div>
              </div>
            `
          });
          notifications.push(emailPromise);
        }
      }
    }

    await Promise.all(notifications);
    console.log(`✅ ${notifications.length} rappels de cotisation envoyés`);
  });

// ========== ÉCHÉANCE PRÊT (7 JOURS AVANT) ==========
exports.checkLoanDueReminders = functions.pubsub
  .schedule('every day 08:00')
  .timeZone('Europe/Paris')
  .onRun(async (context) => {
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const targetDate = sevenDaysLater.toISOString().split('T')[0];

    const loansSnap = await admin.firestore()
      .collection('loans')
      .where('status', '==', 'active')
      .where('dueDate', '==', targetDate)
      .get();

    const notifications = [];

    for (const loanDoc of loansSnap.docs) {
      const loan = loanDoc.data();
      
      const memberDoc = await admin.firestore()
        .collection('members')
        .doc(loan.memberId)
        .get();
      
      const member = memberDoc.data();

      if (member?.email) {
        const emailPromise = transporter.sendMail({
          from: '"Tontine Pour Tous" <notifications@tontine.com>',
          to: member.email,
          subject: '⏰ Échéance de prêt dans 7 jours',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">⏰ Rappel d'Échéance</h1>
              </div>
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; color: #333;">Bonjour <strong>${member.name}</strong>,</p>
                <p style="font-size: 16px; color: #555;">Votre prêt arrive à échéance dans <strong>7 jours</strong>.</p>
                
                <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <h3 style="color: #fa709a; margin-top: 0;">Détails du prêt</h3>
                  <ul style="list-style: none; padding: 0;">
                    <li style="margin: 10px 0;">💰 <strong>Montant restant :</strong> ${loan.amountRemaining.toLocaleString()} FCFA</li>
                    <li style="margin: 10px 0;">📅 <strong>Date d'échéance :</strong> ${new Date(loan.dueDate).toLocaleDateString('fr-FR')}</li>
                    <li style="margin: 10px 0;">💳 <strong>Déjà payé :</strong> ${loan.amountPaid.toLocaleString()} FCFA</li>
                  </ul>
                </div>
                
                <div style="background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; border-radius: 5px;">
                  <p style="margin: 0; color: #0c5460;"><strong>💡 Conseil :</strong> Préparez le montant pour éviter les pénalités de retard.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://tontine-app.web.app" style="background: #fa709a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Voir mes prêts</a>
                </div>
                
                <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 20px;">Tontine Pour Tous</p>
              </div>
            </div>
          `
        });
        notifications.push(emailPromise);
      }
    }

    await Promise.all(notifications);
    console.log(`✅ ${notifications.length} rappels d'échéance envoyés`);
  });

// ========== RAPPORT MENSUEL ==========
exports.sendMonthlyReport = functions.pubsub
  .schedule('0 9 1 * *') // 1er de chaque mois à 9h
  .timeZone('Europe/Paris')
  .onRun(async (context) => {
    const usersSnap = await admin.firestore().collection('users').get();
    const notifications = [];

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userEmail = userDoc.data().email;

      // Stats du mois dernier
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString();
      const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString();

      const transactionsSnap = await admin.firestore()
        .collection('transactions')
        .where('userId', '==', userId)
        .where('date', '>=', startDate.split('T')[0])
        .where('date', '<=', endDate.split('T')[0])
        .get();

      const transactions = transactionsSnap.docs.map(d => d.data());
      
      const stats = {
        contributions: transactions.filter(t => t.type === 'contribution').reduce((s, t) => s + t.amount, 0),
        savings: transactions.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0),
        totalTransactions: transactions.length
      };

      const emailPromise = transporter.sendMail({
        from: '"Tontine Pour Tous" <notifications@tontine.com>',
        to: userEmail,
        subject: `📊 Rapport mensuel - ${lastMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">📊 Rapport Mensuel</h1>
              <p style="color: white; margin: 10px 0;">${lastMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333;">Résumé du mois</h2>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                  <p style="color: #888; margin: 0; font-size: 14px;">Cotisations</p>
                  <p style="color: #667eea; margin: 10px 0; font-size: 24px; font-weight: bold;">${stats.contributions.toLocaleString()} FCFA</p>
                </div>
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                  <p style="color: #888; margin: 0; font-size: 14px;">Épargne</p>
                  <p style="color: #10b981; margin: 10px 0; font-size: 24px; font-weight: bold;">${stats.savings.toLocaleString()} FCFA</p>
                </div>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 0;"><strong>${stats.totalTransactions}</strong> transactions effectuées ce mois</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://tontine-app.web.app/reports" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Voir le rapport complet</a>
              </div>
              
              <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 20px;">Tontine Pour Tous</p>
            </div>
          </div>
        `
      });
      notifications.push(emailPromise);
    }

    await Promise.all(notifications);
    console.log(`✅ ${notifications.length} rapports mensuels envoyés`);
  });

// ========== NOTIFICATION IN-APP ==========
exports.createInAppNotification = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const transaction = snap.data();
    
    await admin.firestore().collection('notifications').add({
      userId: transaction.userId,
      type: 'transaction_created',
      title: 'Nouvelle transaction',
      message: `Transaction de ${transaction.amount} FCFA enregistrée`,
      icon: '💰',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });