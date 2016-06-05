
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta) {
  ehrId = "";

  // TODO: Potrebno implementirati

  return ehrId;
}


// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija
function kreirajEHRzaBolnika() {
	var sessionId = getSessionId();

	var ime = $("#name").val();
	var priimek = $("#surname").val();
	var datumRojstva = $("#birhtday").val();

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#message").html("<span class='obvestilo label " +
      "label-warning fade-in'>Please enter necessary data!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": getSessionId()}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo " +
                          "label label-success fade-in'>EHR successfully created: '" +
                          ehrId + "'.</span>");
		                    $("#EHR").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
	}
}

function formTable() {
   sessionId = getSessionId();
   
   var weight = $("#weight").val();
   var height = $("#height").val();
   var bmi = $("#bmi").val();
   var systolic = $("#systolic").val();
   var diastolic = $("#diastolic").val();
   var oxygen = $("#oxygen").val();
   var temperature = $("#temp").val();
    
    $.ajaxSetup({
    headers: {
        "Ehr-Session": getSessionId()
    }
});

var formParams = {
    "ehrId": getSessionId(),
    templateId: 'Vital Signs',
    format: 'FLAT',
    committer: 'committer'
};

var compositionData = {
   
    "vital_signs/body_weight/any_event/body_weight": weight,
    "vital_signs/height_length/any_event/body_height_length": height,
    "vital_signs/body_mass_index/any_event/body_mass_index": bmi,
    "vital_signs/blood_pressure/any_event/systolic": systolic,
    "vital_signs/blood_pressure/any_event/diastolic": diastolic,
    "vital_signs/pulse/any_event/rate": oxygen,
    "vital_signs/respirations/any_event/depth": temperature,

};

$.ajax({
    url: this.options.baseUrl + "/composition?" + $.param(formParams),
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(compositionData),
    success: function () {

        $.growl({
            icon: "fa fa-check",
            title: "<strong> Success!</strong><br>",
            message: "Composition has been stored."
        },
        {
            type: "success",
            animate: {
                enter: 'animated flipInY',
                exit: 'animated flipOutX'
            },
            delay: 3000
        });

        self.resetForm(); //clear form

        self.getCompositionsHistory(); //table update

        self._closeSession(sessionId);

    }
});

var aql = "select "+
          "a/context/start_time/value as date, "+
          "a_a/data[at0002]/events[at0003]/data[at0001]/items[at0004, 'Body weight']/value as weight, "+
          "a_b/data[at0001]/events[at0002]/data[at0003]/items[at0004, 'Body Height/Length']/value as height, "+
          "a_c/data[at0001]/events[at0002]/data[at0003]/items[at0004]/value as bmi, "+
          "a_d/data[at0001]/events[at0006]/data[at0003]/items[at0004]/value as systolic, "+
          "a_d/data[at0001]/events[at0006]/data[at0003]/items[at0005]/value as diastolic, "+
          "a_d/data[at0001]/events[at0006]/state[at0007]/items[at0008]/value/value as position, "+
          "a_f/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value as rate, "+
          "a_g/data[at0001]/events[at0002]/data[at0003]/items[at0005]/value/value as rhythm, "+
          "a_g/data[at0001]/events[at0002]/data[at0003]/items[at0016]/value/value as depth "+
          "from EHR e "+
          "contains COMPOSITION a "+
          "contains ( "+
          "OBSERVATION a_a[openEHR-EHR-OBSERVATION.body_weight.v1] and "+
          "OBSERVATION a_b[openEHR-EHR-OBSERVATION.height.v1] and "+
          "OBSERVATION a_c[openEHR-EHR-OBSERVATION.body_mass_index.v1] and "+
          "OBSERVATION a_d[openEHR-EHR-OBSERVATION.blood_pressure.v1] and "+
          "OBSERVATION a_f[openEHR-EHR-OBSERVATION.heart_rate-pulse.v1] and "+
          "OBSERVATION a_g[openEHR-EHR-OBSERVATION.respiration.v1]) "+
          "order by date DESC offset 0 limit 100";

$.ajax({
    url: this.options.baseUrl + "/query?" + $.param({"aql": aql}),
    type: 'GET',
    success: function (res) {

        self.buildHistoryTable(res.resultSet);

        self._closeSession(sessionId);
    }
});
}