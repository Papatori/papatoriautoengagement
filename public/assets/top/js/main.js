$('#filter-text').change(function() {
	// GAトラッキング
	ga('send', {
		hitType: 'event',
		eventCategory: 'userInput',
		eventAction: 'input',
		eventLabel: 'searchWord',
		eventValue: 0
	})

	// menuの中から、filter-textにまったく一致しないものを抽出し、非表示
	const filterText = $('#filter-text').val()
	if(filterText.length > 0){
		$('.card').each(function() {
 
			const str = $(this).text();
	
			// filter-text一致チェック
			if(str.match(filterText)){
				if($(this).hasClass('hidden')){
					// 一致するかつ現在非表示のモノはfadeIn対象
					$(this).addClass('showing');
				}
			}else{
				if(!$(this).hasClass('hidden')){
					// 一致しないかつ現在表示中のモノはfadeOut対象
					$(this).addClass('hiding');
				}
			}
		});
	}else {
		$('.card').addClass('showing')
	}

	// 表示制御を行う
	$('.hiding').slideUp();
	$('.showing').slideDown();
	
	// 表示制御用クラスを消して、表示状態クラスhiddenに付け替える
	$('.hiding').addClass('hidden').removeClass('hiding');
	$('.showing').removeClass('hidden').removeClass('showing');
});

