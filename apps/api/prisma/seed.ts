import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Sembrando datos de ejemplo...')

  // --- Usuario administrador ---
  const adminEmail = 'admin@almacen.local'
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Administrador',
      email: adminEmail,
      passwordHash: await bcrypt.hash('admin1234', 10),
      role: 'ADMIN',
    },
  })
  console.log(`   usuario: ${admin.email} / admin1234`)

  const almacenero = await prisma.user.upsert({
    where: { email: 'almacen@almacen.local' },
    update: {},
    create: {
      name: 'Almacenero',
      email: 'almacen@almacen.local',
      passwordHash: await bcrypt.hash('almacen1234', 10),
      role: 'ALMACENERO',
    },
  })

  // --- Catálogo de materiales ---
  const materials = [
    { sku: 'COB-1/4', name: 'Cobre 1/4', category: 'Cobre', unit: 'M', stock: 300, minStock: 100 },
    { sku: 'COB-3/8', name: 'Cobre 3/8', category: 'Cobre', unit: 'M', stock: 250, minStock: 100 },
    { sku: 'COB-1/2', name: 'Cobre 1/2', category: 'Cobre', unit: 'M', stock: 80, minStock: 100 },
    { sku: 'TUB-12/14', name: 'Tubería 12/14', category: 'Tubería', unit: 'M', stock: 120, minStock: 50 },
    { sku: 'TUB-16', name: 'Tubería 16', category: 'Tubería', unit: 'M', stock: 40, minStock: 50 },
    { sku: 'REG-4', name: 'Regleta 4 vías', category: 'Regletas', unit: 'UD', stock: 60, minStock: 20 },
    { sku: 'REG-6', name: 'Regleta 6 vías', category: 'Regletas', unit: 'UD', stock: 15, minStock: 20 },
    { sku: 'AIS-9', name: 'Aislante 9mm', category: 'Aislamiento', unit: 'M', stock: 200, minStock: 80 },
    { sku: 'SUP-R14', name: 'Soporte R14', category: 'Soportes', unit: 'UD', stock: 90, minStock: 30 },
    { sku: 'GAS-410', name: 'Gas R410A', category: 'Refrigerante', unit: 'KG', stock: 25, minStock: 10 },
  ]

  for (const m of materials) {
    await prisma.material.upsert({
      where: { sku: m.sku },
      update: {},
      create: m,
    })
  }
  console.log(`   ${materials.length} materiales`)

  // --- Cliente y obra ---
  const client = await prisma.client.upsert({
    where: { id: 'seed-client-1' },
    update: {},
    create: {
      id: 'seed-client-1',
      name: 'Inmobiliaria Vera S.L.',
      email: 'compras@inmobiliariavera.example',
      phone: '600 000 000',
      address: 'C/ Mayor 1, Valencia',
      notes: 'Cliente de mantenimiento anual.',
    },
  })

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      clientId: client.id,
      name: 'Obra Residencial Los Naranjos',
      serviceType: 'AIRE_ACONDICIONADO',
      status: 'EN_CURSO',
      address: 'Av. Los Naranjos 22, Valencia',
    },
  })
  console.log(`   cliente: ${client.name} · obra: ${project.name}`)

  // --- Listado de materiales de ejemplo (en preparación) ---
  const existingList = await prisma.materialList.findFirst({
    where: { projectId: project.id },
  })
  if (!existingList) {
    const cobre = await prisma.material.findUnique({ where: { sku: 'COB-1/4' } })
    const regleta = await prisma.material.findUnique({ where: { sku: 'REG-4' } })

    await prisma.materialList.create({
      data: {
        projectId: project.id,
        status: 'EN_PREPARACION',
        createdById: almacenero.id,
        notes: 'Material para la planta 1.',
        items: {
          create: [
            cobre && {
              materialId: cobre.id,
              requestedQty: 25,
              preparedQty: 25,
              unit: cobre.unit,
            },
            regleta && {
              materialId: regleta.id,
              requestedQty: 10,
              preparedQty: 0,
              unit: regleta.unit,
            },
          ].filter(Boolean) as {
            materialId: string
            requestedQty: number
            preparedQty: number
            unit: string
          }[],
        },
      },
    })
    console.log('   1 listado de ejemplo')
  }

  console.log('✅ Seed completado')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
