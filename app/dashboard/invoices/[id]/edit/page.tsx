import Form from "@/app/ui/invoices/edit-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { fetchCustomers, fetchInvoiceById } from "@/app/lib/data";
import { notFound } from "next/navigation";
export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;
    const [invoice, customers] = await Promise.all([
        fetchInvoiceById(id),
        fetchCustomers(),
    ]);
    if (!invoice) {
        notFound();
    }
    // 返回一个 JSX 结构，作为页面的主要内容
    return (
        // 定义页面的主要区域
        <main>
            {/* 渲染面包屑导航组件 */}
            <Breadcrumbs
                // 传入面包屑导航的数组
                breadcrumbs={[
                    // 第一个面包屑项：发票列表
                    { label: "Invoices", href: "/dashboard/invoices" },
                    // 第二个面包屑项：编辑发票页面
                    {
                        label: "Edit Invoice", // 显示的文本
                        href: `/dashboard/invoices/${id}/edit`, // 链接地址，包含动态的 invoice ID
                        active: true, // 表示当前页面是激活状态
                    },
                ]}
            />
            {/* 渲染表单组件，并传入获取到的发票数据和客户数据 */}
            <Form invoice={invoice} customers={customers} />
        </main>
    );
}
