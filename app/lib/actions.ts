// 启用服务器端操作，确保此文件中的所有函数都在服务器上运行
'use server';
// 从 zod 库导入 z，用于定义和验证数据模式
import { z } from 'zod';
// 从 next/cache 导入 revalidatePath，用于重新验证指定路径的数据
import { revalidatePath } from 'next/cache';
// 从 postgres 库导入 postgres，用于连接和操作 PostgreSQL 数据库
import postgres from 'postgres';
// 从 next/navigation 导入 redirect，用于在服务器端重定向用户
import { redirect } from 'next/navigation';

// 连接到 PostgreSQL 数据库，使用环境变量 POSTGRES_URL，并要求 SSL 连接
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// 定义表单数据的 Zod 模式，用于验证传入的数据
const FormSchema = z.object({
    // 定义 id 字段为字符串类型
    id: z.string(),
    // 定义 customerId 字段为字符串类型
    customerId: z.string(),
    // 定义 amount 字段为数字类型，并强制转换为数字（例如，从字符串转换）
    amount: z.coerce.number(),
    // 定义 status 字段为枚举类型，只能是 'pending' 或 'paid'
    status: z.enum(['pending', 'paid']),
    // 定义 date 字段为字符串类型
    date: z.string(),
  });
  
// 基于 FormSchema 创建一个新的模式 CreateInvoice，省略 id 和 date 字段
const CreateInvoice = FormSchema.omit({ id: true, date: true });
// 定义异步函数 createInvoice，它接收一个 FormData 对象作为参数
export async function createInvoice(formData: FormData) {
    // 使用 CreateInvoice 模式解析并验证 formData 中的数据，提取 customerId, amount 和 status
    const { customerId, amount, status } = CreateInvoice.parse({
      customerId: formData.get('customerId'), // 获取 customerId 字段的值
      amount: formData.get('amount'),       // 获取 amount 字段的值
      status: formData.get('status'),       // 获取 status 字段的值
      
    });
    // 获取当前日期并格式化为 'YYYY-MM-DD' 字符串
    const date = new Date().toISOString().split('T')[0];
    // 将金额从美元转换为美分（乘以 100）
    const amountInCents = amount * 100;
    // 执行 SQL 插入语句，将发票数据插入到 invoices 表中
    try {
        await sql`
          INSERT INTO invoices (customer_id, amount, status, date)
          VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
      } catch (error) {
        // We'll log the error to the console for now
        console.error(error);
      }
  // 重新验证 /dashboard/invoices 路径，以确保数据是最新的
  revalidatePath('/dashboard/invoices');
  // 重定向用户到 /dashboard/invoices 页面
  redirect('/dashboard/invoices'); 
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });
export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    const amountInCents = amount * 100;
   
    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
          `;
      } catch (error) {
        // We'll log the error to the console for now
        console.error(error);
      }
   
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }

  export async function deleteInvoice(id: string) {
    throw new Error('Failed to Delete Invoice');
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
  }