$(function() {

    var minuteBlocks = [];

    function updateHeatMap()
    {
        var rect = svg.selectAll('rect').data(minuteBlocks);
        rect.enter().append('rect');
        rect.exit().remove();

        var text = svg.selectAll('text').data(minuteBlocks);
        text.enter().append('text');
        text.exit().remove();

        d3.selectAll("text")
            .attr("y", function(d) { return 50*(5-d.minuteIndex)+28; } )
            .attr("x", function(d) { return 50*d.hour+20; } )
            .attr("class", function(d) { return "count"; })
            .text(function(d) { return d.count; });

        d3.selectAll("rect")
            .attr("width", 50)
            .attr("height", 50)
            .attr("y", function(d) { return 50*(5-d.minuteIndex); } )
            .attr("x", function(d) { return 50*d.hour; } )
            .attr("class", function(d) { return "q"+color(d.count)+"-9"; })
            .append("title").text( function(d) {return 'hour = '+d.hour+ ' minuteIndex = '+ d.minuteIndex+ ' count = ' +d.count; });
    }

    function processMessage(msg)
    {
        var hour = msg.sentDate.getHours();
        var minuteIndex = Math.floor( msg.sentDate.getMinutes() / 10 );

        if (processMessage.currentBlock.hour !== hour || processMessage.currentBlock.minuteIndex !== minuteIndex)
        {
            processMessage.currentBlock = {hour: hour, minuteIndex: minuteIndex, count:0 };
            minuteBlocks.push(processMessage.currentBlock);
        }

        processMessage.currentBlock.count++;
        processMessage.maxCount = Math.max(processMessage.maxCount, processMessage.currentBlock.count);
    }
    processMessage.currentBlock = {hour:0, minuteIndex:0, count:0 };
    processMessage.maxCount = 0;

    function generateOldData(inputParameters)
    {
        var params = inputParameters || {};
        var startHour = params.startHour || 0;
        var intervalInSeconds = params.intervalInSeconds || 20;

        var endDate = new Date();
        var currentDate = new Date();
        currentDate.setHours(startHour);
        currentDate.setMinutes(1);

        while (currentDate < endDate)
        {
            var range = (intervalInSeconds*(currentDate.getMinutes()+1) );
            var incrementInSeconds = 1+range * Math.random() ;
            currentDate.setTime(currentDate.getTime() + incrementInSeconds*1000);

            var message = {sentDate: currentDate, text: 'hi'};
            processMessage(message);
        }
    }

    generateOldData();
    var svg = d3.select('div#heatmap').append('svg');
    svg.attr('width', 1200).attr('height', 300).attr("class", "Blues");

    var color = d3.scale.quantize().domain([0, processMessage.maxCount]).range(d3.range(7));

    updateHeatMap();

});
