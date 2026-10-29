// functions/src/triggers/forumTriggers.ts
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
}

/**
 * Sprint 4: Sinkronisasi otomatis Poin Reputasi Kompetensi Alumni di Forum
 * Dipicu ketika balasan forum ditandai sebagai Solusi Terbaik (isAcceptedSolution) atau di-endorse Mentor.
 */
export const onForumReplyWritten = onDocumentWritten(
  "artifacts/{appId}/public/data/alumni_forum_replies/{replyId}",
  async (event) => {
    try {
      const beforeData = event.data?.before?.data();
      const afterData = event.data?.after?.data();
      const targetAlumniId = afterData?.authorAlumniId || beforeData?.authorAlumniId;

      if (!targetAlumniId) return false;

      const acceptedChanged =
        Boolean(beforeData?.isAcceptedSolution) !== Boolean(afterData?.isAcceptedSolution);
      const endorsedChanged =
        Boolean(beforeData?.endorsedByMentor) !== Boolean(afterData?.endorsedByMentor);

      if (!acceptedChanged && !endorsedChanged) return false;

      const db = getDb();
      const appId = event.params.appId || process.env.APP_ID || "blud-app-dev";
      const repliesSnap = await db
        .collection(`artifacts/${appId}/public/data/alumni_forum_replies`)
        .where("authorAlumniId", "==", targetAlumniId)
        .get();

      let acceptedCount = 0;
      let endorsedCount = 0;

      repliesSnap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.isAcceptedSolution) acceptedCount += 1;
        if (d.endorsedByMentor) endorsedCount += 1;
      });

      const reputationScore = acceptedCount * 15 + endorsedCount * 10;

      await db.collection("alumnis").doc(targetAlumniId).set(
        {
          forumReputationScore: reputationScore,
          acceptedSolutionsCount: acceptedCount,
        },
        { merge: true }
      );

      return true;
    } catch (err) {
      console.error("[FORUM REPUTATION TRIGGER ERROR]", err);
      return false;
    }
  }
);

/**
 * Sprint 4 & 5: Closed-Loop Tracer Study Otomatis saat pelamar diterima bekerja (HIRED)
 */
export const onJobApplicationWritten = onDocumentWritten(
  "artifacts/{appId}/public/data/job_applications/{applicationId}",
  async (event) => {
    try {
      const beforeStatus = event.data?.before?.data()?.status;
      const afterData = event.data?.after?.data();
      if (!afterData) return false;

      if (beforeStatus !== "HIRED" && afterData.status === "HIRED") {
        const db = getDb();
      const appId = event.params.appId || process.env.APP_ID || "blud-app-dev";

        if (afterData.alumniId) {
          await db.collection("alumnis").doc(afterData.alumniId).set(
            {
              internalStatus: "HIRED",
              employmentStatus: "Sudah Bekerja",
              company: afterData.companyName || "",
              currentJob: afterData.jobTitle || "",
              isLookingForJob: false,
            },
            { merge: true }
          );
        }

        if (afterData.applicantUid) {
          await db.collection(`artifacts/${appId}/public/data/ecosystem_notifications`).add({
            recipientUid: afterData.applicantUid,
            title: "Selamat! Anda Resmi Diterima Bekerja",
            message: `Lamaran Anda sebagai ${afterData.jobTitle} di ${afterData.companyName} telah dinyatakan DITERIMA (HIRED).`,
            linkUrl: "/profil",
            category: "JOB_APPLICATION",
            readByUids: [],
            createdAt: Date.now(),
          });
        }
      }

      return true;
    } catch (err) {
      console.error("[JOB APPLICATION TRIGGER ERROR]", err);
      return false;
    }
  }
);

