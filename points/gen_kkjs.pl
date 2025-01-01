#!/bin/perl

use warnings;
use strict;

my $lat_start = 6660000;
my $lng_start = 2506000;
# 18k: my $lng_start = 2482000;

my $lat_lng_mult = 1000;

my $lats = 111; # (111 - 1) / 5 = 22 pages
my $lngs = 89;  #  (89 - 1) / 4 = 22 pages
# 18k: my $lats = 131; # (131 - 1) / 5 = 26 pages
# 18k: my $lngs = 137; # (137 - 1) / 4 = 34 pages

my $kkj_lat = 0;
my $kkj_lng = 0;

my $input_fh;
my $line;

if (@ARGV == 1) {
  open($input_fh, "<$ARGV[0]") or die "Can't open input file!";
  print "[\n";
}

for (my $i_lat = 0; $i_lat < $lats; $i_lat++) {
  for (my $i_lng = 0; $i_lng < $lngs; $i_lng++) {
    $kkj_lat = $lat_start + ($i_lat * $lat_lng_mult);
    $kkj_lng = $lng_start + ($i_lng * $lat_lng_mult);
    if (defined($input_fh)) {
      $line = readline($input_fh);
      if ($line =~ /(.+) (.+\d)/) {
        printf("{\"kkj_lat\": %d, \"kkj_lng\": %d, \"lat\": %s, \"lng\": %s}",
               $kkj_lat / $lat_lng_mult, $kkj_lng / $lat_lng_mult, $1, $2);
        if (($i_lat < ($lats - 1)) or ($i_lng < ($lngs - 1))) {
            printf(",");
        }
        printf("\n");
      }
    } else {
      printf("%d %d\n", $kkj_lat, $kkj_lng);
    }
  }
}

if (defined($input_fh)) {
  close($input_fh);
  print "]\n";
}
