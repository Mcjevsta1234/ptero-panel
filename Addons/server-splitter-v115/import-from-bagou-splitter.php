<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

try {
	$hasMasterUuid = (bool) DB::table('servers')->where('split_masteruuid', '!=', '')->first();
	if (!$hasMasterUuid) {
		echo "No split_masteruuid column found in servers table. Skipping import from bagou-splitter.\n";

		return;
	}
} catch (Exception $e) {
	echo "No split_masteruuid column found in servers table. Skipping import from bagou-splitter.\n";

	return;
}

$servers = DB::table('servers')->get()->all();

foreach ($servers as $server) {
	$master_uuid = $server->split_masteruuid;
	$split_limit = $server->split_limit;

	echo "Importing split data for server {$server->uuid} from bagou-splitter...\n";

	if ($master_uuid) {
		try {
			$parent_id = DB::table('servers')->where('uuid', $master_uuid)->get()->first()->id;
			if ($parent_id && $parent_id != $server->id) {
				DB::table('servers')->where('id', $server->id)->update([
					'parent_id' => $parent_id,
					'splitter_limit' => $split_limit,
				]);
			} else {
				DB::table('servers')->where('id', $server->id)->update([
					'splitter_limit' => $split_limit,
				]);
			}
		} catch (Exception $e) {
			// Do nothing
		}
	}
}

Schema::table('servers', function (Blueprint $table) {
	$table->dropColumn('split_masteruuid');
	$table->dropColumn('split_limit');
});