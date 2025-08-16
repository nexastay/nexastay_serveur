/*
  Warnings:

  - You are about to drop the column `securityDepositHeld` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentIntentId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceProofUrl` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `touristRegistrationNumber` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `fiscalNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isAccountVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WelcomeBooklet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_Participants` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockItem" DROP CONSTRAINT "StockItem_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "WelcomeBooklet" DROP CONSTRAINT "WelcomeBooklet_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "_Participants" DROP CONSTRAINT "_Participants_A_fkey";

-- DropForeignKey
ALTER TABLE "_Participants" DROP CONSTRAINT "_Participants_B_fkey";

-- DropIndex
DROP INDEX "Booking_stripePaymentIntentId_key";

-- DropIndex
DROP INDEX "Property_touristRegistrationNumber_key";

-- DropIndex
DROP INDEX "User_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "securityDepositHeld",
DROP COLUMN "stripePaymentIntentId",
ADD COLUMN     "hasPets" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "numberOfTravelers" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "insuranceProofUrl",
DROP COLUMN "touristRegistrationNumber",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "photos" TEXT[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "fiscalNumber",
DROP COLUMN "isAccountVerified",
DROP COLUMN "stripeCustomerId";

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "OrderItem";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "StockItem";

-- DropTable
DROP TABLE "Task";

-- DropTable
DROP TABLE "WelcomeBooklet";

-- DropTable
DROP TABLE "_Participants";

-- DropEnum
DROP TYPE "StockStatus";

-- DropEnum
DROP TYPE "TaskStatus";

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
