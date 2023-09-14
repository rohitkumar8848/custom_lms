import frappe
import json
@frappe.whitelist()
def quiz_summary(quiz, results):
	frappe.msgprint("jhdsfk")
	score = 0
	results = results and json.loads(results)
	unique_result = {d['question_index']: d for d in results}.values()
	unique_result = list(unique_result)
	for result in results:
		correct = result["is_correct"][0]
		result["question"] = frappe.db.get_value(
			"LMS Quiz Question",
			{"parent": quiz, "idx": result["question_index"] + 1},
			["question"],
		)

		for point in result["is_correct"]:
			correct = correct and point

		result["is_correct"] = correct
		score += correct
		del result["question_index"]
	
	submission = frappe.get_doc(
		{
			"doctype": "LMS Quiz Submission",
			"quiz": quiz,
			"result": unique_result,
			"score": score,
			"member": frappe.session.user,
		}
	)
	submission.save(ignore_permissions=True)

	return {
		"score": score,
		"submission": submission.name,
	}
