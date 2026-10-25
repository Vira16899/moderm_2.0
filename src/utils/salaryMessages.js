export function validateSalary(amount, description) {
  const errors = {};
  const salary = Number(amount);
  if (amount == null || String(amount).trim() === '') errors.amount = 'សូមបញ្ចូលប្រាក់បៀវត្សថ្មី។';
  else if (!Number.isFinite(salary) || salary < 0 || !Number.isSafeInteger(Math.round(salary * 100)) || Math.abs(salary * 100 - Math.round(salary * 100)) > .000001) {
    errors.amount = 'សូមបញ្ចូលប្រាក់បៀវត្សចាប់ពី 0 និងមានខ្ទង់ទសភាគមិនលើសពី 2។';
  }
  if (!String(description ?? '').trim()) errors.description = 'សូមបញ្ចូលមូលហេតុ ឬការពិពណ៌នានៃការកែប្រែប្រាក់បៀវត្ស។';
  else if (description.trim().length > 1000) errors.description = 'ការពិពណ៌នាមិនអាចលើសពី 1000 តួអក្សរបានទេ។';
  return errors;
}

export function salaryError(cause) {
  const message = String(cause?.message || '');
  if (/description_salary|description|reason/i.test(message)) {
    return { description: /empty|required|missing/i.test(message) ? 'សូមបញ្ចូលមូលហេតុ ឬការពិពណ៌នានៃការកែប្រែប្រាក់បៀវត្ស។' : 'សូមពិនិត្យការពិពណ៌នា ហើយព្យាយាមម្តងទៀត។' };
  }
  if (/base_salary|"salary"/i.test(message)) return { amount: 'សូមបញ្ចូលប្រាក់បៀវត្សត្រឹមត្រូវ ចាប់ពី 0។' };
  if (/network|timeout|fetch|connection/i.test(message)) return { general: 'មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត ហើយព្យាយាមម្តងទៀត។' };
  if (/unauthorized|forbidden|permission|401|403/i.test(message)) return { general: 'អ្នកមិនមានសិទ្ធិកែប្រែប្រាក់បៀវត្សនេះទេ ឬការចូលប្រព័ន្ធបានផុតកំណត់។ សូមចូលប្រព័ន្ធម្តងទៀត។' };
  return { general: /[\u1780-\u17ff]/.test(message) && !/[a-z]/i.test(message) ? message : 'មិនអាចធ្វើបច្ចុប្បន្នភាពប្រាក់បៀវត្សបានទេ។ សូមព្យាយាមម្តងទៀត។' };
}
