frappe.ready(() => {
	const self = this;
	this.quiz_submitted = false;
	this.answer = [];
	this.is_correct = [];
	this.show_answers = $("#quiz-title").data("show-answers");
	localStorage.removeItem($("#quiz-title").data("name"));

	$(".btn-start-quiz").click((e) => {
		$("#start-banner").addClass("hide");
		$("#quiz-form").removeClass("hide");
		mark_active_question();
	});

	$(".option").click((e) => {
		if (!$("#check").hasClass("hide")) enable_check(e);
	});

	$(".possibility").keyup((e) => {
		enable_check(e);
	});

	$("#summary").click((e) => {
		e.preventDefault();
		if (!this.show_answers) check_answer();

		setTimeout(() => {
			quiz_summary(e);
		}, 500);
	});

	$("#check").click((e) => {
		e.preventDefault();
		check_answer(e);
	});

	$("#next").click((e) => {
		e.preventDefault();
		if (!this.show_answers) check_answer();

		mark_active_question(e);
	});

	$("#prev").click((e) => {
		e.preventDefault();
		if (!this.show_answers) check_answer();

		mark_prev_active_question(e);
	});

	$("#try-again").click((e) => {
		try_quiz_again(e);
	});
});

const mark_active_question = (e = undefined) => {
	let total_questions = $(".question").length;
	let current_index = $(".active-question").attr("data-qt-index") || 0;
	let next_index = parseInt(current_index) + 1;

	if (this.show_answers) {
		$("#next").addClass("hide");
		$("#prev").addClass("hide");
	} else if (!this.show_answers && next_index == total_questions) {
		$("#next").addClass("hide");
		$("#summary").removeClass("hide");
	} 

	$(".question").addClass("hide").removeClass("active-question");
	$(`.question[data-qt-index='${next_index}']`)
		.removeClass("hide")
		.addClass("active-question");

	$(".current-question").text(`${next_index}`);
	$("#check").removeClass("hide").attr("disabled", true);
	$("#next").attr("disabled", false);
	console.log(current_index)
	if (parseInt(current_index) < 1){
		$("#prev").addClass("hide");
		console.log("in")
	}else{$("#prev").removeClass("hide");}
	if (current_index > 1){
		$("#prev").attr("disabled", false);	
	}
	
	$(".explanation").addClass("hide");

	$(".timer").addClass("hide");
	calculate_and_display_time(100);
	$(".timer").removeClass("hide");
	initialize_timer();
};

const mark_prev_active_question = (e = undefined) => {
	let total_questions = $(".question").length;
	let current_index = $(".active-question").attr("data-qt-index") || 0;
	let prev_index = parseInt(current_index) - 1;
	console.log("pre", current_index)
	if (this.show_answers) {
		$("#prev").addClass("hide");
		$("#next").addClass("hide");
	} else if (!this.show_answers && current_index == 1) {
		$("#summary").removeClass("hide");
	}
	if (parseInt(prev_index) ==  1){
		$("#prev").addClass("hide");
	} else
		{$("#prev").removeClass("hide");} 

	$(".question").addClass("hide").removeClass("active-question");
	$(`.question[data-qt-index='${prev_index}']`)
		.removeClass("hide")
		.addClass("active-question");

	$(".current-question").text(`${prev_index}`);
	$("#check").removeClass("hide").attr("disabled", true);
	$("#prev").attr("disabled", false);
	$("#next").removeClass("hide");
	
	$(".explanation").addClass("hide");

	$(".timer").addClass("hide");
	calculate_and_display_time(100);
	$(".timer").removeClass("hide");
	initialize_timer();
};

const calculate_and_display_time = (percent_time) => {
	$(".timer .progress-bar").attr("aria-valuenow", percent_time);
	$(".timer .progress-bar").attr("aria-valuemax", percent_time);
	$(".timer .progress-bar").css("width", `${percent_time}%`);
	let progress_color = percent_time < 20 ? "red" : "var(--primary-color)";
	$(".timer .progress-bar").css("background-color", progress_color);
};

const initialize_timer = () => {
	this.time_left = $(".timer").data("time");
	calculate_and_display_time(100, this.time_left);
	$(".timer").removeClass("hide");
	const total_time = $(".timer").data("time");
	this.start_time = new Date().getTime();
	const self = this;
	let old_diff;

	this.timer = setInterval(function () {
		var diff = (new Date().getTime() - self.start_time) / 1000;
		var variation = old_diff ? diff - old_diff : diff;
		old_diff = diff;
		self.time_left -= variation;
		let percent_time = (self.time_left / total_time) * 100;
		calculate_and_display_time(percent_time);
		if (self.time_left <= 0) {
			clearInterval(self.timer);
			$(".timer").addClass("hide");
			check_answer();
		}
	}, 100);
};

const enable_check = (e) => {
	
	if ($(".option:checked").length || $(".possibility").val().trim()) {
		$("#check").removeAttr("disabled");
		$("#next").removeAttr("disabled");
		$("#prev").removeAttr("disabled");
		$(".custom-checkbox").removeClass("active-option");
		$(".option:checked")
			.closest(".custom-checkbox")
			.addClass("active-option");
	}
};

const quiz_summary = (e = undefined) => {
	e && e.preventDefault();
	let quiz_name = $("#quiz-title").data("name");
	let total_questions = $(".question").length;
	let self = this;

	frappe.call({
		method: "lms.lms.doctype.lms_quiz.lms_quiz.quiz_summary",
		args: {
			quiz: quiz_name,
			results: localStorage.getItem(quiz_name),
		},
		callback: (data) => {
			$(".question").addClass("hide");
			$("#summary").addClass("hide");
			$(".quiz-footer span").addClass("hide");
			$("#quiz-form").prepend(
				`<div class="summary bold-heading text-center">
					${__("Your submission is successful. We will update you asap.")}
				
				</div>`
			);
			$("#try-again").attr("data-submission", data.message.submission);
			$("#try-again").removeClass("hide");
			$("#prev").addClass("hide");
			self.quiz_submitted = true;
			if (this.hasOwnProperty("marked_as_complete")) {
				mark_progress();
			}
		},
	});
};

const try_quiz_again = (e) => {
	e.preventDefault();
	if (window.location.href.includes("new-submission")) {
		const target = $(e.currentTarget);
		window.location.href = `/quiz-submission/
		${target.data("quiz")}/
		${target.data("submission")}`;
	} else {
		window.location.reload();
	}
};

const check_answer = (e = undefined) => {
	e && e.preventDefault();
	
	let answer = $(".active-question textarea");
	let total_questions = $(".question").length;
	let current_index = $(".active-question").attr("data-qt-index");
	// if (answer.length && !answer.val().trim()) {
	// 	frappe.throw(__("Please enter your answer"));
	// }
	console.log("check",current_index)
	clearInterval(self.timer);
	$(".timer").addClass("hide");

	$(".explanation").removeClass("hide");
	$("#check").addClass("hide");

	if (current_index == total_questions) {
		$("#summary").removeClass("hide");
		$("#prev").removeClass("hide");
	} else if (this.show_answers) {
		$("#next").removeClass("hide");
		// if (current_index > 1){
		// 	$("#prev").removeClass("hide");
		// }
	} 
	parse_options(current_index);
};

const parse_options = (current_index) => {
	let user_answers = [];
	let element;
	let type = $(".active-question").data("type");

	if (type == "Choices") {
		$(".active-question input").each((i, element) => {
			if ($(element).prop("checked")) {
				user_answers.push(decodeURIComponent($(element).val()));
			}
		});
		element = $(".active-question input");
	} else {
		user_answers.push($(".active-question textarea").val());
		element = $(".active-question textarea");
	}

	is_answer_correct(type, user_answers, element, current_index);
};

const is_answer_correct = (type, user_answers, element, current_index) => {
	frappe.call({
		async: false,
		method: "lms.lms.doctype.lms_quiz.lms_quiz.check_answer",
		args: {
			question: $(".active-question").data("name"),
			type: type,
			answers: user_answers,
		},
		callback: (data) => {
			type == "Choices"
				? parse_choices(element, data.message)
				: parse_possible_answers(element, data.message);
			add_to_local_storage(current_index);
		},
	});
};

const parse_choices = (element, is_correct) => {
	element.each((i, elem) => {
		if ($(elem).prop("checked")) {
			self.answer.push(decodeURIComponent($(elem).val()));
			self.is_correct.push(is_correct[i]);
			if (this.show_answers)
				is_correct[i]
					? add_icon(elem, "check")
					: add_icon(elem, "wrong");
		} else {
			add_icon(elem, "minus-circle");
		}
	});
};

const parse_possible_answers = (element, correct) => {
	self.answer.push(decodeURIComponent($(element).val()));
	self.is_correct.push(correct);
	if (this.show_answers)
		correct
			? show_indicator("success", element)
			: show_indicator("failure", element);
};

const show_indicator = (class_name, element) => {
	let label = class_name == "success" ? "Correct" : "Incorrect";
	let icon =
		class_name == "success" ? "#icon-solid-success" : "#icon-solid-error";
	$(`<div class="answer-indicator ${class_name}">
			<svg class="icon icon-md">
				<use href=${icon}>
			</svg>
			<span style="font-weight: 500">${__(label)}</span>
		</div>`).insertAfter(element);
};

const add_icon = (element, icon) => {
	$(element).closest(".custom-checkbox").removeClass("active-option");
	$(element).closest(".option").addClass("hide");
	let label = $(element).siblings(".option-text").text();
	$(element).siblings(".option-text").html(`
        <div>
            <img class="d-inline mr-3" src="/assets/lms/icons/${icon}.svg">
            ${label}
        </div>
    `);
};

const add_to_local_storage = (current_index) => {
	// let current_index = $(".active-question").attr("data-qt-index");
	let quiz_name = $("#quiz-title").data("name");
	let quiz_stored = JSON.parse(localStorage.getItem(quiz_name));
	let total_questions = $(".question").length;
	
	let quiz_obj = {
		question_index: current_index-1,
		answer: self.answer.join(),
		is_correct: self.is_correct,
	};
	console.log(quiz_obj)
	quiz_stored ? quiz_stored.push(quiz_obj) : (quiz_stored = [quiz_obj]);
	localStorage.setItem(quiz_name, JSON.stringify(quiz_stored));

	self.answer = [];
	self.is_correct = [];
};
