$(function() {

    var minuteBlocks = [];
    var timeLabelMinuteBlocks = [];

    function stripMinutesAndMillis(fromDate)
    {
        fromDate.setMinutes(0);
        fromDate.setMilliseconds(0);
        return fromDate;
    }

    function copyDate(fromDate)
    {
        var newDate = new Date();
        newDate.setTime(fromDate.getTime());
        return newDate;
    }

    function calculateX(minuteBlock)
    {
        // only hours matter
        var delta = updateHeatMap.currentDateX.getTime()-minuteBlock.sentDate.getTime();
        var delta_hours = Math.floor(delta / (60*60*1000));
        var x = (24 - delta_hours)*50;
        return x;
    }

    function calculateY(minuteBlock)
    {
        // only minutes matter
        var index = Math.floor(minuteBlock.sentDate.getMinutes()/10);
        var y = (5 - index)*50;
        return y;
    }
    
    function purgeOldData()
    {
    	var earliestDate = copyDate(updateHeatMap.currentDateX);
        earliestDate.setHours(earliestDate.getHours()-25);
        earliestDate.setMinutes(0);
        
        var done = false;
        while (!done)
        {
        	if (minuteBlocks[0].sentDate < earliestDate)
        	{
        		minuteBlocks.shift();
        		
        		if (minuteBlocks[0].sentDate.getMinutes() === 0)
        		{
        			timeLabelMinuteBlocks.shift();
        		}
        	}
        	else
        	{
        		done = true;
        	}        	
        }        
    }

    function updateHeatMap()
    {
        updateHeatMap.currentDateX = new Date();
        updateHeatMap.currentDateX.setMinutes(59);
        updateHeatMap.currentDateX.setHours(updateHeatMap.currentDateX.getHours()+1);

		purgeOldData();		

        var rect = svg.selectAll('rect').data(minuteBlocks);
        rect.enter().append('rect');
        rect.exit().remove();

        var text = svg.selectAll('text.countLabel').data(minuteBlocks);
        text.enter().append('text').attr("class", "countLabel");
        text.exit().remove();
        
        d3.selectAll("text.countLabel")
            .attr("y", function(d) { return calculateY(d)+25; } )
            .attr("x", function(d) { return calculateX(d)+15; } )
            .attr("class", "countLabel")
            .text(function(d) { return d.count; });
        
        var label = svg.selectAll('text.hourLabel').data(timeLabelMinuteBlocks);
        label.enter().append('text').attr("class", "hourLabel");
        label.exit().remove();
        
        d3.selectAll("text.hourLabel")
            .attr("y", function(d) { return calculateY(d)+25+50; } )
            .attr("x", function(d) { return calculateX(d)+15; } )
            .text(function(d) { 
            	return d.sentDate.getHours(); 
            });        

        d3.selectAll("rect")
            .attr("width", 50)
            .attr("height", 50)
            .attr("y", function(d) { return calculateY(d); } )
            .attr("x", function(d) { return calculateX(d); } )
            .attr("class", function(d) { return "q"+color(d.count)+"-9"; });            
    }


    function processMessage(msg)
    {
        var minute = Math.floor( msg.sentDate.getMinutes() / 10 )*10;
        msg.sentDate.setMinutes(minute);
        msg.sentDate.setSeconds(0);
        msg.sentDate.setMilliseconds(0);

        if (processMessage.currentBlock == null || processMessage.currentBlock.sentDate.getMinutes() !== msg.sentDate.getMinutes())
        {
            processMessage.currentBlock = {sentDate: msg.sentDate, count:0};
            minuteBlocks.push(processMessage.currentBlock);
            
            if (processMessage.currentBlock.sentDate.getMinutes() === 0)
            {
            	timeLabelMinuteBlocks.push(processMessage.currentBlock);
            }
            
        }

        processMessage.currentBlock.count++;
        processMessage.maxCount = Math.max(processMessage.maxCount, processMessage.currentBlock.count);
    }
    processMessage.currentBlock = null;
    processMessage.maxCount = 0;

    function generateOldData(inputParameters)
    {
        var params = inputParameters || {};
        var intervalInSeconds = params.intervalInSeconds || 25;

        var endDate = new Date();
        var currentDate = new Date();
        currentDate.setTime(currentDate.getTime()-24*60*60*1000+1);

        while (currentDate < endDate)
        {
            var range = (intervalInSeconds*(currentDate.getMinutes()+currentDate.getHours()*3));
            range = range / 10;
            var incrementInSeconds = 1+range * Math.random() ;
            currentDate.setTime(currentDate.getTime() + incrementInSeconds*1000);

            var message = {sentDate: copyDate(currentDate), text: 'hi'};
            processMessage(message);
        }
    }

    function generateNewData(inputParameters)
    {
        var params = inputParameters || generateNewData.params || {};
        var intervalInSeconds = params.intervalInSeconds || 20;

        var currentDate = new Date();
        var message = {sentDate: currentDate, text: 'hi'};
        processMessage(message);
        updateHeatMap();

        var incrementInSeconds = 1+intervalInSeconds * Math.random() ;
        setTimeout(generateNewData, incrementInSeconds*10000);
    }
    generateNewData.params = null;

    generateOldData();
    var svg = d3.select('div#heatmap').append('svg');
    svg.attr('width', 1200).attr('height', 350).attr("class", "Blues");

    var color = d3.scale.quantize().domain([0, processMessage.maxCount]).range(d3.range(9));
    
    updateHeatMap();

    generateNewData();

});
