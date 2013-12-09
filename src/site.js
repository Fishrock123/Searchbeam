$(document).ready(function() {
	var s = 0
		, timeid = -1
		, lastScroll = 0
		, page = window.location.pathname.slice(1) + window.location.search;
	if (page === '') { page = 'home'; }
	page = page.match(/home|about|projects|blog(?!\?title=|\?id=)/);
	if (page && page.length > 0) {
		$('#' + page[0]).children().addClass('current-page');
	}
	$(window).scroll(function() {
		((s = $(window).scrollTop()) > 25 ? s = 25 : s) < 0 ? s = 0 : s;
		if (s === lastScroll) return;
		$('header').css('line-height', (45 - s) + 'px');
		$('header > .line').css('height', (55 - s) + 'px');
		lastScroll = s;
	});
	window.setTimeout(function() {
		$('#cover').addClass('cover-transition');
	}, 1000);
	function hideLogin(time) {
		window.clearTimeout(timeid);
		timeid = window.setTimeout(function() {
			$('.login').addClass('hidden');
			$('.blurable').removeClass('blur');
			$('#cover').removeClass('show_cover');
			$('#auth').addClass('faint');
		}, time);
	}
	function showLogin(time) {
		window.clearTimeout(timeid);
		timeid = -1;
		$('#auth').removeClass('faint');
		if (user === false) {
			timeid = window.setTimeout(function() {
				$('.login').removeClass('hidden');
				if (window.innerWidth > 720) $('.blurable').addClass('blur');
				$('#cover').addClass('show_cover');
			}, time);
		}
	}
	$('#auth, .login_box, .login > .triangle').hover(function(e) {
		showLogin(300);
	}, function(e) {
		hideLogin(800);
	}).on('touchend', function(e) {
		showLogin(60);
	});
	$('#cover').on('touchend', function(e) {
		hideLogin(100);
	}).hover(function(e) {
		if (timeid === -1) hideLogin(800);
	});
	$(this).on('mouseout', function(e) {
        var from = e.relatedTarget || e.toElement;
        if (!from || from.nodeName == "HTML") {
            window.clearTimeout(timeid);
            timeid = -1;
        }
	});
	$('#auth').click(function(e) {
		if (user === false) return false;
		$('#ainfo').text('Logging out...');
		$("#auth-err, #auth-success").hide();
		$('#auth').addClass('faint');
		$.ajax({
			type: "POST",
			url: '/logout',
			dataType: "html",
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			},
			success: function(data) {
				$("#auth").html(data);
			},
			timeout: 60000
		});
		return false;
	});
	$('#login').submit(function(e) {
		$("#auth-err, #auth-success").hide();
		$.ajax({
			type: "POST",
			url: '/auth',
			data: $('#login').serialize(),
			dataType: "json",
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			},
			success: function(data) {
				if (data.error) {
					$("#auth-err").show().text(data.error);
				} else if (data.success) {
					$("#auth-success").show().text(data.success);
					$("#auth").html(data.html);
					window.clearTimeout(timeid);
					timeid = window.setTimeout(function() {
						$('.login').addClass('hidden');
						$('.blurable').removeClass('blur');
						$('#cover').removeClass('show_cover');
						$('#auth').addClass('faint');
					}, 2000);
				}
			},
			timeout: 60000
		});
		return false;
	});
});