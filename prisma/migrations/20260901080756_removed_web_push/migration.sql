/*
  Warnings:

  - You are about to drop the `pushSubscription` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pushSubscription" DROP CONSTRAINT "pushSubscription_userId_fkey";

-- DropTable
DROP TABLE "pushSubscription";
